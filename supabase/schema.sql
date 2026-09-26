-- ============================================================================
--  RUN THIS IN SUPABASE SQL EDITOR
--  Supabase dashboard -> SQL Editor -> New query -> paste everything -> Run
--
--  Safe to re-run: every statement is idempotent.
--  BEFORE you run it, scroll to STEP 8 at the bottom and put YOUR admin email
--  in it (or run that one statement later, after creating your login).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- STEP 1 - Admin allow-list
-- Anyone who can log in is "authenticated", but only users listed here are
-- treated as admins. This keeps the CMS locked even if sign-ups were ever on.
-- ----------------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;


-- ----------------------------------------------------------------------------
-- STEP 2 - Tables
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(btrim(name)) between 1 and 80),
  description   text check (description is null or char_length(description) <= 300),
  display_order integer not null default 0,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists public.images (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references public.categories (id) on delete cascade,
  storage_path  text not null,           -- full-size file inside the bucket
  thumb_path    text,                    -- smaller version used in the gallery grid
  image_url     text not null,           -- public URL of the full-size file
  thumb_url     text,                    -- public URL of the thumbnail
  title         text,
  description   text,
  width         integer check (width  is null or width  > 0),
  height        integer check (height is null or height > 0),
  display_order integer not null default 0,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
-- STEP 3 - Indexes
-- ----------------------------------------------------------------------------
create unique index if not exists categories_name_unique on public.categories (lower(name));
create index if not exists categories_display_order_idx  on public.categories (display_order);
create index if not exists images_category_order_idx     on public.images (category_id, display_order);


-- ----------------------------------------------------------------------------
-- STEP 4 - Table privileges (RLS below decides which rows each role can touch)
-- ----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select                         on public.categories to anon;
grant select                         on public.images     to anon;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.images     to authenticated;
grant select                         on public.admins     to authenticated;


-- ----------------------------------------------------------------------------
-- STEP 5 - Row Level Security
-- ----------------------------------------------------------------------------
alter table public.admins     enable row level security;
alter table public.categories enable row level security;
alter table public.images     enable row level security;

-- admins: a logged-in user can only see their own row (used by the app to check access).
-- There is deliberately NO insert/update/delete policy: admins are added only from the SQL editor.
drop policy if exists "Users can read their own admin row" on public.admins;
create policy "Users can read their own admin row"
  on public.admins for select to authenticated
  using (user_id = (select auth.uid()));

-- categories
drop policy if exists "Public can read published categories" on public.categories;
create policy "Public can read published categories"
  on public.categories for select to anon, authenticated
  using (is_published = true);

drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories"
  on public.categories for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- images
drop policy if exists "Public can read published images" on public.images;
create policy "Public can read published images"
  on public.images for select to anon, authenticated
  using (
    is_published = true
    and exists (
      select 1 from public.categories c
      where c.id = images.category_id and c.is_published = true
    )
  );

drop policy if exists "Admins manage images" on public.images;
create policy "Admins manage images"
  on public.images for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ----------------------------------------------------------------------------
-- STEP 6 - Reordering functions (one call saves a whole new order)
-- They run with the caller's permissions, so RLS still applies.
-- ----------------------------------------------------------------------------
create or replace function public.reorder_categories(ordered_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.categories c
     set display_order = o.ord::int
    from unnest(ordered_ids) with ordinality as o(id, ord)
   where c.id = o.id;
end;
$$;

create or replace function public.reorder_images(ordered_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.images i
     set display_order = o.ord::int
    from unnest(ordered_ids) with ordinality as o(id, ord)
   where i.id = o.id;
end;
$$;

revoke all on function public.reorder_categories(uuid[]) from public, anon;
revoke all on function public.reorder_images(uuid[])     from public, anon;
grant execute on function public.reorder_categories(uuid[]) to authenticated;
grant execute on function public.reorder_images(uuid[])     to authenticated;


-- ----------------------------------------------------------------------------
-- STEP 7 - Storage bucket + storage policies
-- Bucket is public (anyone can view photos). Only admins can upload/change/delete.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-images',
  'portfolio-images',
  true,
  20971520,  -- 20 MB per file (the admin uploader shrinks photos before uploading)
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update
  set public             = true,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view portfolio images" on storage.objects;
create policy "Public can view portfolio images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'portfolio-images');

drop policy if exists "Admins can upload portfolio images" on storage.objects;
create policy "Admins can upload portfolio images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio-images' and public.is_admin());

drop policy if exists "Admins can update portfolio images" on storage.objects;
create policy "Admins can update portfolio images"
  on storage.objects for update to authenticated
  using      (bucket_id = 'portfolio-images' and public.is_admin())
  with check (bucket_id = 'portfolio-images' and public.is_admin());

drop policy if exists "Admins can delete portfolio images" on storage.objects;
create policy "Admins can delete portfolio images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio-images' and public.is_admin());


-- ----------------------------------------------------------------------------
-- Sample categories (skipped if a category with the same name already exists)
-- ----------------------------------------------------------------------------
insert into public.categories (name, description, display_order) values
  ('Black & White', 'Moments captured without color.',        1),
  ('Skies',         'Clouds, sunsets and everything above.',  2),
  ('Nature',        'Quiet corners and green light.',         3),
  ('Ocean',         'Salt air, tides and horizon lines.',     4),
  ('Architecture',  'Lines, light and old walls.',            5)
on conflict do nothing;


-- ----------------------------------------------------------------------------
-- STEP 8 - MAKE YOURSELF AN ADMIN  (edit the email!)
--
--  1. Supabase dashboard -> Authentication -> Users -> Add user -> Create new user
--     (enter your email + a strong password, tick "Auto Confirm User").
--  2. Replace you@example.com below with that same email.
--  3. Run this statement (you can run it on its own at any time).
-- ----------------------------------------------------------------------------
insert into public.admins (user_id)
select id from auth.users where email = 'sanibhartu13@gmail.com'
on conflict do nothing;
