'use client';

import { useState, useEffect, useRef } from 'react';
import type { PenFile } from '@/lib/pen-types';

interface UsePenParserState {
  data: PenFile | null;
  loading: boolean;
  error: string | null;
}

export function usePenParser(fileUrl: string | null): UsePenParserState {
  const [state, setState] = useState<UsePenParserState>({
    data: null,
    loading: false,
    error: null,
  });
  const cachedUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!fileUrl) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    if (cachedUrl.current === fileUrl) return;

    cachedUrl.current = fileUrl;
    setState({ data: null, loading: true, error: null });

    fetch(fileUrl)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to fetch .pen file: ${res.status}`);
        return res.json() as Promise<PenFile>;
      })
      .then((json) => {
        if (!json.canvas || !Array.isArray(json.canvas.frames)) {
          throw new Error('Invalid .pen format: missing canvas.frames');
        }
        setState({ data: json, loading: false, error: null });
      })
      .catch((err: Error) => {
        setState({ data: null, loading: false, error: err.message ?? 'Failed to parse .pen file' });
      });
  }, [fileUrl]);

  return state;
}
