import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

interface HealthResult {
  service: string;
  env_var: string;
  status: 'ok' | 'error' | 'missing';
  latency_ms: number | null;
  detail: string;
}

async function checkGitHub(): Promise<HealthResult> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return { service: 'GitHub', env_var: 'GITHUB_TOKEN', status: 'missing', latency_ms: null, detail: 'GITHUB_TOKEN not set' };
  const start = Date.now();
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'factory-dashboard' },
    });
    const latency_ms = Date.now() - start;
    if (res.ok) {
      const data = await res.json();
      return { service: 'GitHub', env_var: 'GITHUB_TOKEN', status: 'ok', latency_ms, detail: `Authenticated as ${data.login}` };
    }
    return { service: 'GitHub', env_var: 'GITHUB_TOKEN', status: 'error', latency_ms, detail: `HTTP ${res.status}` };
  } catch (e) {
    return { service: 'GitHub', env_var: 'GITHUB_TOKEN', status: 'error', latency_ms: null, detail: e instanceof Error ? e.message : 'Connection failed' };
  }
}

async function checkSupabase(): Promise<HealthResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { service: 'Supabase', env_var: 'SUPABASE_SERVICE_ROLE_KEY', status: 'missing', latency_ms: null, detail: 'SUPABASE_SERVICE_ROLE_KEY not set' };
  const start = Date.now();
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    const latency_ms = Date.now() - start;
    if (res.ok || res.status === 200) {
      const ref = new URL(url).hostname.split('.')[0];
      return { service: 'Supabase', env_var: 'SUPABASE_SERVICE_ROLE_KEY', status: 'ok', latency_ms, detail: `Connected to project ref ${ref}` };
    }
    return { service: 'Supabase', env_var: 'SUPABASE_SERVICE_ROLE_KEY', status: 'error', latency_ms, detail: `HTTP ${res.status}` };
  } catch (e) {
    return { service: 'Supabase', env_var: 'SUPABASE_SERVICE_ROLE_KEY', status: 'error', latency_ms: null, detail: e instanceof Error ? e.message : 'Connection failed' };
  }
}

async function checkVercel(): Promise<HealthResult> {
  const token = process.env.VERCEL_TOKEN;
  if (!token) return { service: 'Vercel', env_var: 'VERCEL_TOKEN', status: 'missing', latency_ms: null, detail: 'VERCEL_TOKEN not set' };
  const start = Date.now();
  try {
    const res = await fetch('https://api.vercel.com/v2/user', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const latency_ms = Date.now() - start;
    if (res.ok) {
      return { service: 'Vercel', env_var: 'VERCEL_TOKEN', status: 'ok', latency_ms, detail: 'Token valid' };
    }
    return { service: 'Vercel', env_var: 'VERCEL_TOKEN', status: 'error', latency_ms, detail: `HTTP ${res.status}` };
  } catch (e) {
    return { service: 'Vercel', env_var: 'VERCEL_TOKEN', status: 'error', latency_ms: null, detail: e instanceof Error ? e.message : 'Connection failed' };
  }
}

async function checkAnthropic(): Promise<HealthResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { service: 'Anthropic', env_var: 'ANTHROPIC_API_KEY', status: 'missing', latency_ms: null, detail: 'ANTHROPIC_API_KEY not set' };
  const start = Date.now();
  try {
    const res = await fetch('https://api.anthropic.com/v1/models', {
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    });
    const latency_ms = Date.now() - start;
    if (res.ok) {
      return { service: 'Anthropic', env_var: 'ANTHROPIC_API_KEY', status: 'ok', latency_ms, detail: 'API key valid' };
    }
    return { service: 'Anthropic', env_var: 'ANTHROPIC_API_KEY', status: 'error', latency_ms, detail: `HTTP ${res.status}` };
  } catch (e) {
    return { service: 'Anthropic', env_var: 'ANTHROPIC_API_KEY', status: 'error', latency_ms: null, detail: e instanceof Error ? e.message : 'Connection failed' };
  }
}

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const results = await Promise.all([checkGitHub(), checkSupabase(), checkVercel(), checkAnthropic()]);
  return NextResponse.json({ results, checked_at: new Date().toISOString() });
}
