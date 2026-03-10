'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, Factory } from 'lucide-react';

type Mode = 'password' | 'magic';

export default function LoginPage() {
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof import('@/lib/supabase')['createSupabaseBrowserClient']> | null>(null);

  const getSupabase = async () => {
    if (!supabaseRef.current) {
      const { createSupabaseBrowserClient } = await import('@/lib/supabase');
      supabaseRef.current = createSupabaseBrowserClient();
    }
    return supabaseRef.current;
  };

  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const supabase = await getSupabase();
      if (mode === 'password') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
        router.refresh();
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        setSuccess('Check your email for a magic link!');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--background)' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--primary)' }}
          >
            <Factory className="w-6 h-6" style={{ color: '#fff' }} />
          </div>
          <span
            className="text-2xl font-bold"
            style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}
          >
            Factory Dashboard
          </span>
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-8 border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <h1
            className="text-xl font-semibold mb-2"
            style={{ fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)' }}
          >
            Sign in
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Access your factory monitoring dashboard
          </p>

          {/* Mode toggle */}
          <div
            className="flex rounded-lg p-1 mb-6"
            style={{ background: 'var(--surface-alt)' }}
          >
            {(['password', 'magic'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                className="flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors"
                style={{
                  background: mode === m ? 'var(--surface)' : 'transparent',
                  color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: mode === m ? '1px solid var(--border)' : '1px solid transparent',
                }}
              >
                {m === 'password' ? 'Password' : 'Magic Link'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none transition-colors"
                  style={{
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            {/* Password (only in password mode) */}
            {mode === 'password' && (
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none transition-colors"
                    style={{
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Error / Success */}
            {error && (
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{ background: '#EF444420', color: 'var(--error)', border: '1px solid #EF444440' }}
              >
                {error}
              </div>
            )}
            {success && (
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{ background: '#22C55E20', color: 'var(--success)', border: '1px solid #22C55E40' }}
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'password' ? 'Sign In' : 'Send Magic Link'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
