export interface SessionInfo {
  id: string;
  created_at: string;
  user_agent: string;
  ip: string;
  is_current: boolean;
}

export function parseUserAgent(ua: string): { device: string; icon: 'Monitor' | 'Smartphone' | 'Globe' } {
  if (!ua) return { device: 'Unknown device', icon: 'Globe' };

  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera|Brave)/i)?.[1] ?? 'Browser';
  const os = ua.match(/(Windows NT|Mac OS X|Linux|Android|iOS|iPhone OS)/i)?.[1];

  const osFriendly: Record<string, string> = {
    'Windows NT': 'Windows',
    'Mac OS X': 'macOS',
    'iPhone OS': 'iOS',
  };

  const osName = os ? (osFriendly[os] ?? os) : '';

  return {
    device: `${browser}${osName ? ` on ${osName}` : ''}`,
    icon: isMobile ? 'Smartphone' : 'Monitor',
  };
}

export function formatSessionDate(createdAt: string): string {
  try {
    return new Date(createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return createdAt;
  }
}
