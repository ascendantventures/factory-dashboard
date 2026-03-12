'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FdNotificationPreferences } from '@/lib/notification-types';

interface UseNotificationPreferencesReturn {
  preferences: FdNotificationPreferences | null;
  loading: boolean;
  saving: boolean;
  saved: boolean;
  updatePreferences: (updates: Partial<FdNotificationPreferences>) => Promise<void>;
}

export function useNotificationPreferences(): UseNotificationPreferencesReturn {
  const [preferences, setPreferences] = useState<FdNotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await fetch('/api/notifications/preferences');
        if (!res.ok) return;
        const data = await res.json();
        setPreferences(data.preferences);
      } finally {
        setLoading(false);
      }
    };
    fetchPreferences();
  }, []);

  const updatePreferences = useCallback(async (updates: Partial<FdNotificationPreferences>) => {
    // Optimistic update
    setPreferences((prev) => prev ? { ...prev, ...updates } : null);
    setSaved(false);

    // Clear existing debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        const res = await fetch('/api/notifications/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const data = await res.json();
          setPreferences(data.preferences);
          setSaved(true);

          // Auto-hide "Saved" indicator after 2s
          if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
          savedTimerRef.current = setTimeout(() => setSaved(false), 2500);
        }
      } finally {
        setSaving(false);
      }
    }, 400);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  return { preferences, loading, saving, saved, updatePreferences };
}
