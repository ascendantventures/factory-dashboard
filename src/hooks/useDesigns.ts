'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PencilDesignRow } from '@/lib/pen-types';

interface UseDesignsState {
  designs: PencilDesignRow[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDesigns(repoId: string): UseDesignsState {
  const [designs, setDesigns] = useState<PencilDesignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!repoId) return;
    setLoading(true);
    setError(null);

    fetch(`/api/designs/${encodeURIComponent(repoId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to fetch designs: ${res.status}`);
        return res.json() as Promise<{ designs: PencilDesignRow[] }>;
      })
      .then(({ designs }) => {
        setDesigns(designs);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [repoId, tick]);

  return { designs, loading, error, refetch };
}

interface UseDesignState {
  design: PencilDesignRow | null;
  loading: boolean;
  error: string | null;
}

export function useDesign(repoId: string, issueNumber: number | null): UseDesignState {
  const [design, setDesign] = useState<PencilDesignRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repoId || issueNumber === null) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    fetch(`/api/designs/${encodeURIComponent(repoId)}/${issueNumber}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to fetch design: ${res.status}`);
        return res.json() as Promise<{ design: PencilDesignRow | null }>;
      })
      .then(({ design }) => {
        setDesign(design);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [repoId, issueNumber]);

  return { design, loading, error };
}
