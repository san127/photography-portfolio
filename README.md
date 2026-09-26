# Saniya Bhartu — Photography Portfolio

A personal photography portfolio built with **React + Vite + Supabase**. The public
site reads categories and photographs from Supabase; the `/admin` dashboard lets you
manage everything (create categories, upload photos, reorder, edit captions, delete)
without touching code.

---

## 1. Install dependencies

```bash
npm install
```

## 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In **Project Settings → API**, copy your **Project URL** and **anon / publishable key**.
3. Copy `.env.example` to `.env` in the project root and fill in those two values:

   ```bash
   cp .env.example .env
   ```

   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
   ```

   Never put your `service_role` key here — only the anon/publishable key belongs in the frontend.

## 3. Run the database setup script

1. In the Supabase dashboard, open **SQL Editor → New query**.
2. Open `supabase/schema.sql` from this project, copy the **entire file**, paste it into the editor, and click **Run**.

This one script creates:
- `categories` and `images` tables (UUID primary keys, foreign key, timestamps, indexes)
- Row Level Security policies (public read for published content; only admins can write)
- The `portfolio-images` Storage bucket + storage policies (public read, admin-only write)
- `reorder_categories` / `reorder_images` helper functions used by the drag-and-drop admin UI
- A handful of sample categories so the site isn't empty on first run

It's safe to re-run the whole script at any time — every statement is idempotent.

## 4. Create your admin login

1. In Supabase: **Authentication → Users → Add user**. Enter your email + a password, and tick **Auto Confirm User**.
2. Back in the **SQL Editor**, run the final statement from `supabase/schema.sql` (Step 8), with your email substituted:

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'you@example.com'
   on conflict do nothing;
   ```

   Only emails listed in the `admins` table can manage the gallery — signing in alone isn't enough, which keeps the CMS locked even if someone else creates an account.

## 5. Run it

```bash
npm run dev
```

- Public site: `http://localhost:5173`
- Admin login: `http://localhost:5173/admin/login`

## 6. Add your own content

- **About section text & contact details**: edit `src/config/site.js` — one file, no need to touch any component.
- **Profile photo**: replace `public/images/profile.jpg` with your own image (same filename), or upload nothing and the site shows a tasteful placeholder instead.
- **Categories & photos**: log in at `/admin` and manage everything from there — no code changes needed. Create a category (e.g. "Ocean"), upload photos into it, drag to reorder categories or photos within a category, and it all appears on the public site immediately in that order.

---

## How it's organized

```
src/
├── components/          Public-site UI (Navbar, About, Photography, Lightbox, Contact...)
│   └── admin/            Admin-only UI (panels, modals, confirm dialog)
├── pages/                Route-level pages: Home, AdminLogin, AdminDashboard, NotFound
├── context/              AuthContext (Supabase session + admin check)
├── hooks/                usePortfolio, useReveal, useScrollSpy, useSessionState, useDragReorder
├── lib/                  supabase.js (client), api.js (all queries), imageProcessing.js (resize/thumbnail)
├── config/site.js        Your name, contact info, and About-section placeholder text
└── styles/               Plain CSS per section, plus global.css for design tokens
supabase/schema.sql       One script: tables, RLS, storage bucket, policies, sample data
```

## Notes on how things work

- **Images are never cropped.** The gallery uses a CSS-columns masonry layout that
  respects each photo's real aspect ratio, and the fullscreen lightbox always shows
  the complete image (`object-fit: contain`).
- **Uploads are resized in the browser** before hitting Supabase Storage: a full-size
  version (capped at 2560px on the long edge) and a small thumbnail (capped at
  1000px) used for the gallery grid, so visitors aren't downloading full-resolution
  files just to browse.
- **Category and photo order** is stored as `display_order` in the database and
  changed via drag-and-drop in the admin dashboard (`reorder_categories` /
  `reorder_images` RPC functions), so the public site always matches what you see
  in `/admin`.
- **Only admins can write.** Row Level Security checks an `admins` allow-list table
  (via `public.is_admin()`), not just "is logged in" — so creating a Supabase Auth
  account by itself does not grant CMS access.
- **Collapsed/expanded state** for each category is remembered for the current
  browser session (`sessionStorage`) so it doesn't reset while you're browsing, but
  starts fresh next visit.
- Empty states, failed image loads, and a missing/misconfigured Supabase connection
  all show a friendly message instead of a blank or broken page.

## Deploying

The app is a static Vite build (`npm run build` → `dist/`), so it works on Vercel,
Netlify, Cloudflare Pages, or any static host. `vercel.json` and `public/_redirects`
are included so client-side routes like `/admin` don't 404 on refresh. Remember to
set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables on
whichever host you use — the `.env` file itself is git-ignored and won't be deployed.
