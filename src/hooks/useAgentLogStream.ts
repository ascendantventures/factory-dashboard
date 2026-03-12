'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface LogLine {
  id: string;
  text: string;
  timestamp: string;
}

export interface AgentDonePayload {
  exit_code: number | null;
  run_status: string;
  estimated_cost_usd: number | null;
}

interface UseAgentLogStreamOptions {
  runId: string | null;
  onComplete?: (payload: AgentDonePayload) => void;
}

interface UseAgentLogStreamResult {
  lines: LogLine[];
  isStreaming: boolean;
  isComplete: boolean;
  exitCode: number | null;
  cost: number | null;
  error: string | null;
}

function makeTimestamp(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
}

let lineCounter = 0;
function makeLineId(): string {
  return `line-${++lineCounter}-${Date.now()}`;
}

export function useAgentLogStream({
  runId,
  onComplete,
}: UseAgentLogStreamOptions): UseAgentLogStreamResult {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [cost, setCost] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const offsetRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!runId || !mountedRef.current) return;

    // Clean up existing connection
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const url = `/api/agents/logs/${runId}?offset=${offsetRef.current}`;
    const es = new EventSource(url);
    esRef.current = es;
    setIsStreaming(true);
    setError(null);

    es.addEventListener('log_chunk', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as { lines: string[]; offset: number };
        const ts = makeTimestamp();
        const newLines: LogLine[] = data.lines.map(text => ({
          id: makeLineId(),
          text,
          timestamp: ts,
        }));
        offsetRef.current = data.offset;
        setLines(prev => [...prev, ...newLines]);
      } catch {
        // Ignore parse errors
      }
    });

    es.addEventListener('agent_done', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as AgentDonePayload;
        setExitCode(data.exit_code ?? 0);
        setCost(data.estimated_cost_usd);
        setIsStreaming(false);
        setIsComplete(true);
        onComplete?.(data);
        es.close();
        esRef.current = null;
      } catch {
        // Ignore
      }
    });

    es.addEventListener('heartbeat', () => {
      // Keep-alive, nothing to do
    });

    es.onerror = () => {
      if (!mountedRef.current) return;
      es.close();
      esRef.current = null;
      setIsStreaming(false);

      // Reconnect after 2s from last offset
      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current && !isComplete) {
          connect();
        }
      }, 2000);
    };
  }, [runId, onComplete, isComplete]);

  useEffect(() => {
    mountedRef.current = true;

    if (!runId) {
      setLines([]);
      setIsStreaming(false);
      setIsComplete(false);
      setExitCode(null);
      setCost(null);
      setError(null);
      offsetRef.current = 0;
      return;
    }

    // Reset state for new run
    setLines([]);
    setIsComplete(false);
    setExitCode(null);
    setCost(null);
    setError(null);
    offsetRef.current = 0;

    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [runId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { lines, isStreaming, isComplete, exitCode, cost, error };
}
