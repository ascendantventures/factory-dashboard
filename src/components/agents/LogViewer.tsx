'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import { useAgentLogStream } from '@/hooks/useAgentLogStream';
import { AgentMetadataBar } from './AgentMetadataBar';
import { LogViewerLine } from './LogViewerLine';
import { LogViewerToolbar } from './LogViewerToolbar';

interface AgentRunMeta {
  id: string;
  station: string | null;
  model: string | null;
  pid: number | null;
  started_at: string | null;
  estimated_cost_usd: number | null;
  run_status: string;
  exit_code?: number | null;
}

interface LogViewerProps {
  run: AgentRunMeta;
  onClose?: () => void;
  mode?: 'panel' | 'embedded';
}

export function LogViewer({ run, onClose, mode = 'embedded' }: LogViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);

  const { lines, isStreaming, isComplete, exitCode, cost } = useAgentLogStream({
    runId: run.id,
  });

  // Auto-scroll to bottom when new lines arrive
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lines, autoScroll]);

  // Detect user scroll to disable auto-scroll
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    if (!isAtBottom && autoScroll) {
      setAutoScroll(false);
      userScrolledRef.current = true;
    }
  }, [autoScroll]);

  const handleAutoScrollToggle = useCallback(() => {
    const next = !autoScroll;
    setAutoScroll(next);
    if (next && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [autoScroll]);

  // Filter lines by search
  const filteredLines = searchQuery
    ? lines.filter(l => l.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : lines;

  const isRunning = run.run_status === 'running' && !isComplete;
  const effectiveStatus = isComplete
    ? exitCode === 0
      ? 'completed'
      : 'failed'
    : run.run_status;

  const panelHeight = mode === 'panel'
    ? 'calc(100vh - 64px)'
    : '500px';

  return (
    <div
      data-testid="log-viewer"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#0D0E12',
        border: '1px solid #2A2F3A',
        borderRadius: 12,
        overflow: 'hidden',
        height: panelHeight,
        minHeight: 400,
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      {/* Metadata bar */}
      <AgentMetadataBar
        runId={run.id}
        station={run.station}
        model={run.model}
        pid={run.pid ?? null}
        startedAt={run.started_at}
        estimatedCost={cost ?? run.estimated_cost_usd}
        runStatus={effectiveStatus}
        exitCode={isComplete ? exitCode : (run.exit_code ?? null)}
        isComplete={isComplete}
        onClose={onClose}
      />

      {/* Log content area */}
      <div
        ref={scrollContainerRef}
        data-testid="log-content"
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 0',
          scrollBehavior: autoScroll ? 'smooth' : 'auto',
        }}
        className="custom-scrollbar"
      >
        {lines.length === 0 && !isStreaming && !isComplete && (
          <EmptyState
            icon={<FileText style={{ width: 48, height: 48, color: '#3D4555' }} />}
            title="No log output yet"
            subtitle="Waiting for agent to start writing..."
          />
        )}

        {lines.length === 0 && !isStreaming && isComplete && (
          <EmptyState
            icon={<AlertCircle style={{ width: 48, height: 48, color: '#F87171' }} />}
            title="Log file not found"
            subtitle="The log file may not have been uploaded yet."
          />
        )}

        {filteredLines.map(line => (
          <LogViewerLine
            key={line.id}
            line={line}
            searchQuery={searchQuery}
          />
        ))}

        {/* Streaming indicator */}
        {isRunning && lines.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 16px',
              color: '#6B7280',
              fontSize: 12,
              fontFamily: 'Outfit, system-ui, sans-serif',
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#E5A830',
                animation: 'pulse-ring 1.5s ease-out infinite',
              }}
            />
            Streaming...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Toolbar */}
      <LogViewerToolbar
        runId={run.id}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        autoScroll={autoScroll}
        onAutoScrollToggle={handleAutoScrollToggle}
      />
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 200,
        padding: 32,
        textAlign: 'center',
      }}
    >
      {icon}
      <p
        style={{
          marginTop: 16,
          fontSize: 15,
          fontWeight: 600,
          color: '#A8B0BF',
          fontFamily: 'Outfit, system-ui, sans-serif',
        }}
      >
        {title}
      </p>
      {subtitle && (
        <p
          style={{
            marginTop: 6,
            fontSize: 13,
            color: '#6B7280',
            fontFamily: 'Outfit, system-ui, sans-serif',
            maxWidth: 280,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
