'use client';

import { useState, useEffect } from 'react';

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function useElapsedTime(startedAt: string | null | undefined): string {
  const [elapsed, setElapsed] = useState<string>('0:00');

  useEffect(() => {
    if (!startedAt) return;

    function tick() {
      const start = new Date(startedAt!).getTime();
      const now = Date.now();
      const seconds = Math.max(0, Math.floor((now - start) / 1000));
      setElapsed(formatElapsed(seconds));
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return elapsed;
}
