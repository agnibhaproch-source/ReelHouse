'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config';

let client: SupabaseClient | null = null;
let loading: Promise<SupabaseClient | null> | null = null;

/**
 * Loads the Supabase browser client on demand (keeps ~65 KB of auth/realtime code out of the
 * first load, and out of the bundle entirely when accounts aren't configured).
 */
export function loadSupabaseBrowser(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) return Promise.resolve(null);
  if (client) return Promise.resolve(client);
  loading ??= import('@supabase/ssr').then(({ createBrowserClient }) => {
    client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return client;
  });
  return loading;
}
