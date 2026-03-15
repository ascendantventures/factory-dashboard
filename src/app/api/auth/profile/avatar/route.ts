import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { BUCKETS } from '@/lib/storage';

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File must be under 2 MB' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, or WebP images are allowed' }, { status: 400 });
  }

  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
  const path = `${user.id}/avatar.${ext}`;

  const admin = createSupabaseAdminClient();

  // Delete any existing avatar files first (to avoid orphans with different extensions)
  const { data: existing } = await admin.storage.from(BUCKETS.avatars).list(user.id);
  if (existing && existing.length > 0) {
    await admin.storage.from(BUCKETS.avatars).remove(existing.map(f => `${user.id}/${f.name}`));
  }

  // Upload new avatar
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await admin.storage.from(BUCKETS.avatars).upload(path, arrayBuffer, {
    contentType: file.type,
    upsert: true,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Generate signed URL (1 year TTL)
  const { data: signedUrlData, error: signedUrlError } = await admin.storage
    .from(BUCKETS.avatars)
    .createSignedUrl(path, 60 * 60 * 24 * 365);

  if (signedUrlError || !signedUrlData) {
    return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 });
  }

  const avatar_url = signedUrlData.signedUrl;

  // Upsert avatar_url into fd_user_profiles (table has auth trigger — use upsert)
  const { error: upsertError } = await admin.from('fd_user_profiles').upsert(
    { user_id: user.id, avatar_url },
    { onConflict: 'user_id' }
  );

  if (upsertError) {
    console.error('[avatar] Failed to upsert fd_user_profiles:', upsertError.message);
    // Don't fail the request — return the URL anyway
  }

  return NextResponse.json({ avatar_url });
}

export async function DELETE(_req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createSupabaseAdminClient();

  // List and delete all avatar files for this user
  const { data: files } = await admin.storage.from(BUCKETS.avatars).list(user.id);
  if (files && files.length > 0) {
    await admin.storage.from(BUCKETS.avatars).remove(files.map(f => `${user.id}/${f.name}`));
  }

  // Nullify avatar_url in fd_user_profiles
  const { error: updateError } = await admin.from('fd_user_profiles').upsert(
    { user_id: user.id, avatar_url: null },
    { onConflict: 'user_id' }
  );

  if (updateError) {
    console.error('[avatar] Failed to nullify avatar_url:', updateError.message);
  }

  return NextResponse.json({ success: true });
}
