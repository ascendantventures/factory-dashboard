/**
 * Supabase-backed TTL cache for Vercel API responses.
 * Uses fdash_vercel_cache table with upsert to avoid auth trigger issues.
 */

import { createSupabaseAdminClient } from './supabase-server';

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('fdash_vercel_cache')
      .select('data, expires_at')
      .eq('cache_key', key)
      .single();

    if (error || !data) return null;

    // Check TTL
    if (new Date(data.expires_at) < new Date()) {
      return null;
    }

    return data.data as T;
  } catch {
    return null;
  }
}

export async function setCached<T>(
  key: string,
  value: T,
  ttlMinutes: number
): Promise<void> {
  try {
    const supabase = createSupabaseAdminClient();
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

    await supabase.from('fdash_vercel_cache').upsert(
      {
        cache_key: key,
        data: value as Record<string, unknown>,
        cached_at: new Date().toISOString(),
        expires_at: expiresAt,
      },
      { onConflict: 'cache_key' }
    );
  } catch {
    // Cache write failures are non-fatal
  }
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    const supabase = createSupabaseAdminClient();
    await supabase.from('fdash_vercel_cache').delete().eq('cache_key', key);
  } catch {
    // Non-fatal
  }
}
