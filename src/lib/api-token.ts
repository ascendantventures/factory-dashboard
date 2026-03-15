import crypto from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export interface TokenRecord {
  id: string;
  token_hash: string;
  description: string;
  created_by: string | null;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Extract raw token from Authorization: Bearer <token> header.
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/**
 * Look up an active API token by raw value.
 * Updates last_used_at on success (fire-and-forget).
 */
export async function lookupToken(raw: string): Promise<TokenRecord | null> {
  const hash = hashToken(raw);
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from('uat_api_tokens')
    .select('*')
    .eq('token_hash', hash)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  // Update last_used_at — non-blocking
  admin
    .from('uat_api_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => {/* fire-and-forget */});

  return data as TokenRecord;
}
