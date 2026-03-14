'use client';

import { useEffect, useState } from 'react';

export function useAppDisplayName(repoId: string): string | null {
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (!repoId) return;

    fetch(`/api/apps/${encodeURIComponent(repoId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.app?.display_name) {
          setDisplayName(data.app.display_name);
        } else if (data?.app?.repo_full_name) {
          setDisplayName(data.app.repo_full_name);
        }
      })
      .catch(() => {
        // Silent fail — breadcrumb shows loading state
      });
  }, [repoId]);

  return displayName;
}
