'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { ActivityEventRow } from './ActivityEvent';

export function ActivityFeed() {
  const { events, loading, error } = useActivityFeed();

  if (loading) {
    return (
      <div className="flex flex-col gap-2 px-2 py-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 px-3 py-2.5 animate-pulse"
          >
            <div
              className="w-7 h-7 rounded-full flex-shrink-0"
              style={{ background: '#27272A' }}
            />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 rounded" style={{ background: '#27272A', width: '70%' }} />
              <div className="h-2.5 rounded" style={{ background: '#27272A', width: '50%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 px-4 text-center">
        <p className="text-xs" style={{ color: '#71717A' }}>
          Failed to load activity
        </p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div
        data-testid="activity-empty"
        className="flex flex-col items-center justify-center py-12 px-4 text-center gap-2"
      >
        <div className="text-2xl">📡</div>
        <p className="text-sm font-medium" style={{ color: '#A1A1AA' }}>
          No activity yet
        </p>
        <p className="text-xs" style={{ color: '#71717A' }}>
          Waiting for pipeline events…
        </p>
        <p
          className="text-xs mt-1"
          style={{ color: '#71717A', maxWidth: '240px' }}
        >
          Events appear when agents complete stages, builds finish, or issues are deployed.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col py-1 overflow-y-auto flex-1">
      <AnimatePresence initial={false}>
        {events.map((event) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <ActivityEventRow event={event} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
