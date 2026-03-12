import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

function maskValue(value: string | undefined): string | null {
  if (!value) return null;
  if (value.length < 10) return '****';
  return `${value.slice(0, 4)}****...****${value.slice(-3)}`;
}

const ENV_VARS = [
  { name: 'GITHUB_TOKEN', required: true },
  { name: 'SUPABASE_URL', required: true },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', required: true },
  { name: 'NEXT_PUBLIC_SUPABASE_URL', required: true },
  { name: 'ANTHROPIC_API_KEY', required: true },
  { name: 'VERCEL_TOKEN', required: false },
];

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const variables = ENV_VARS.map(({ name, required }) => {
    const value = process.env[name];
    return {
      name,
      status: value ? 'set' : 'missing',
      required,
      masked_preview: maskValue(value),
    };
  });

  return NextResponse.json({ variables });
}
