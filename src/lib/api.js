import { supabase, BUCKET } from './supabase.js';
import { processImage } from './imageProcessing.js';

function client() {
  if (!supabase) throw new Error('Supabase is not configured. Add your keys to the .env file.');
  return supabase;
}

export function friendlyError(err) {
  if (!err) return 'Something went wrong.';
  const msg = err.message || String(err);
  if (err.code === '23505') return 'A category with that name already exists.';
  if (err.code === '42501' || /row-level security|not authorized|permission denied/i.test(msg)) {
    return "You don't have permission to do that. Make sure you're signed in with the admin account.";
  }
  if (
    err.code === 'PGRST205' ||
    err.code === '42P01' ||
    /does not exist|schema cache|could not find the table/i.test(msg)
  ) {
    return 'The database tables were not found. Run supabase/schema.sql in the Supabase SQL Editor.';
  }
  if (/failed to fetch|networkerror|network request failed|load failed/i.test(msg)) {
    return "Can't reach Supabase. Check your internet connection and the values in your .env file.";
  }
  return msg;
}

const clean = (v) => {
  const t = typeof v === 'string' ? v.trim() : '';
  return t.length ? t : null;
};

/* ------------------------------ reading ------------------------------ */

const IMAGE_FIELDS =
  'id,category_id,image_url,thumb_url,title,description,width,height,display_order';

// Public site: only published categories, only published photos, both in the admin's order.
export async function fetchPublicPortfolio() {
  const { data, error } = await client()
    .from('categories')
    .select(`id,name,description,display_order,images(${IMAGE_FIELDS})`)
    .eq('is_published', true)
    .eq('images.is_published', true)
    .order('display_order', { ascending: true })
    .order('display_order', { referencedTable: 'images', ascending: true })
    .order('created_at', { referencedTable: 'images', ascending: true });
  if (error) throw error;
  return (data ?? []).map((c) => ({ ...c, images: c.images ?? [] }));
}

// Admin: everything, including hidden items.
export async function fetchAdminPortfolio() {
  const { data, error } = await client()
    .from('categories')
    .select('*, images(*)')
    .order('display_order', { ascending: true })
    .order('display_order', { referencedTable: 'images', ascending: true })
    .order('created_at', { referencedTable: 'images', ascending: true });
  if (error) throw error;
  return (data ?? []).map((c) => ({ ...c, images: c.images ?? [] }));
}

/* ------------------------------ categories ------------------------------ */

export async function createCategory({ name, description, is_published, display_order }) {
  const { data, error } = await client()
    .from('categories')
    .insert({ name: name.trim(), description: clean(description), is_published, display_order })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id, { name, description, is_published }) {
  const { data, error } = await client()
    .from('categories')
    .update({ name: name.trim(), description: clean(description), is_published })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function removeFiles(paths) {
  const list = paths.filter(Boolean);
  for (let i = 0; i < list.length; i += 100) {
    // Best effort: a leftover file is harmless, a failed delete shouldn't block the user.
    await client().storage.from(BUCKET).remove(list.slice(i, i + 100));
  }
}

export async function deleteCategory(category) {
  const paths = category.images.flatMap((img) => [img.storage_path, img.thumb_path]);
  const { error } = await client().from('categories').delete().eq('id', category.id); // cascades to images
  if (error) throw error;
  await removeFiles(paths);
}

export async function reorderCategories(ids) {
  const { error } = await client().rpc('reorder_categories', { ordered_ids: ids });
  if (error) throw error;
}

/* ------------------------------ images ------------------------------ */

export async function updateImage(id, { title, description, is_published }) {
  const { data, error } = await client()
    .from('images')
    .update({ title: clean(title), description: clean(description), is_published })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteImage(image) {
  const { error } = await client().from('images').delete().eq('id', image.id);
  if (error) throw error;
  await removeFiles([image.storage_path, image.thumb_path]);
}

export async function reorderImages(ids) {
  const { error } = await client().rpc('reorder_images', { ordered_ids: ids });
  if (error) throw error;
}

async function nextImageOrder(categoryId) {
  const { data, error } = await client()
    .from('images')
    .select('display_order')
    .eq('category_id', categoryId)
    .order('display_order', { ascending: false })
    .limit(1);
  if (error) throw error;
  return (data?.[0]?.display_order ?? 0) + 1;
}

// 1) shrink in the browser  2) upload full + thumbnail to Storage
// 3) read their public URLs  4) insert the metadata row (rolls the files back if that fails)
export async function uploadPhoto({ file, categoryId, title, description }) {
  const sb = client();
  const processed = await processImage(file);

  const id = crypto.randomUUID();
  const storagePath = `${categoryId}/${id}.${processed.ext}`;
  const thumbPath = `${categoryId}/${id}_thumb.jpg`;
  const options = { cacheControl: '31536000', upsert: false };

  const full = await sb.storage
    .from(BUCKET)
    .upload(storagePath, processed.full, { ...options, contentType: processed.fullType });
  if (full.error) throw full.error;

  const thumb = await sb.storage
    .from(BUCKET)
    .upload(thumbPath, processed.thumb, { ...options, contentType: 'image/jpeg' });
  if (thumb.error) {
    await removeFiles([storagePath]);
    throw thumb.error;
  }

  const imageUrl = sb.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
  const thumbUrl = sb.storage.from(BUCKET).getPublicUrl(thumbPath).data.publicUrl;

  try {
    const displayOrder = await nextImageOrder(categoryId);
    const { data, error } = await sb
      .from('images')
      .insert({
        category_id: categoryId,
        storage_path: storagePath,
        thumb_path: thumbPath,
        image_url: imageUrl,
        thumb_url: thumbUrl,
        title: clean(title),
        description: clean(description),
        width: processed.width,
        height: processed.height,
        display_order: displayOrder,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    await removeFiles([storagePath, thumbPath]);
    throw err;
  }
}
