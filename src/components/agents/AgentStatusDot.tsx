'use client';

interface AgentStatusDotProps {
  status: 'running' | 'completed' | 'failed' | 'timeout' | string;
  size?: 'sm' | 'md';
}

export function AgentStatusDot({ status, size = 'md' }: AgentStatusDotProps) {
  const isRunning = status === 'running';
  const isSuccess = status === 'completed';
  const isError = status === 'failed' || status === 'timeout';

  const dotSize = size === 'sm' ? 8 : 10;
  const ringSize = size === 'sm' ? 16 : 20;

  let dotColor = '#6B7280';
  if (isRunning) dotColor = '#E5A830';
  else if (isSuccess) dotColor = '#34D399';
  else if (isError) dotColor = '#F87171';

  return (
    <div
      style={{
        width: ringSize,
        height: ringSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {isRunning && (
        <div
          style={{
            position: 'absolute',
            width: ringSize,
            height: ringSize,
            borderRadius: '50%',
            border: `2px solid rgba(229, 168, 48, 0.3)`,
            animation: 'pulse-ring 1.5s ease-out infinite',
          }}
        />
      )}
      <div
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: dotColor,
          flexShrink: 0,
        }}
      />
    </div>
  );
}
