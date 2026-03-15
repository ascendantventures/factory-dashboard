'use client';

import Image from 'next/image';

interface AvatarPreviewProps {
  avatarUrl?: string | null;
  displayName?: string;
  email?: string;
  size?: number;
}

export function getInitials(name: string | undefined, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return email.split('@')[0].slice(0, 2).toUpperCase();
}

export function AvatarPreview({ avatarUrl, displayName, email = '', size = 96 }: AvatarPreviewProps) {
  const initials = getInitials(displayName, email);

  return (
    <div
      data-testid="avatar-preview"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        border: '3px solid #3F3F46',
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: avatarUrl ? '#18181B' : '#27272A',
        transition: 'border-color 150ms ease-out',
        position: 'relative',
      }}
      onMouseEnter={e => {
        if (!avatarUrl) return;
        (e.currentTarget as HTMLDivElement).style.borderColor = '#6366F1';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#3F3F46';
      }}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={displayName ?? 'Avatar'}
          fill
          style={{ objectFit: 'cover' }}
          unoptimized
        />
      ) : (
        <span
          data-testid="avatar-initials"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: `${Math.round(size * 0.33)}px`,
            fontWeight: 600,
            color: '#FAFAFA',
            userSelect: 'none',
            lineHeight: 1,
          }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}
