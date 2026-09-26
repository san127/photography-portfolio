import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const BUCKET = 'portfolio-images';

// If the .env file is missing or wrong we export `null` instead of crashing the whole app,
// so pages can show a friendly "finish setup" message.
export const isSupabaseConfigured = Boolean(url && key && /^https?:\/\//.test(url));

export const supabase = isSupabaseConfigured ? createClient(url, key) : null;
