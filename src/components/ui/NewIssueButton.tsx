'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import QuickCreateModal from '@/components/QuickCreateModal';

export function NewIssueButton() {
  const [open, setOpen] = useState(false);
  const [trackedRepos, setTrackedRepos] = useState<string[]>([]);

  useEffect(() => {
    async function loadRepos() {
      try {
        const { createSupabaseBrowserClient } = await import('@/lib/supabase');
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('dash_dashboard_config')
          .select('tracked_repos')
          .eq('user_id', user.id)
          .single();
        if (data?.tracked_repos) setTrackedRepos(data.tracked_repos);
      } catch {
        // non-fatal
      }
    }
    loadRepos();
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors hover:opacity-90"
        style={{
          background: '#6366F1',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
        }}
        aria-label="Create new issue"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">New Issue</span>
      </button>

      <QuickCreateModal
        isOpen={open}
        onClose={() => setOpen(false)}
        trackedRepos={trackedRepos}
      />
    </>
  );
}
