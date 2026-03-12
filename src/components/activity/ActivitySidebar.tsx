'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Radio } from 'lucide-react';
import { ActivityFeed } from './ActivityFeed';

interface ActivitySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function ActivitySidebar({ isOpen, onToggle }: ActivitySidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          data-testid="activity-sidebar"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="flex-shrink-0 flex flex-col border-l overflow-hidden"
          style={{
            borderColor: '#27272A',
            background: '#111113',
            height: '100%',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
            style={{ borderColor: '#27272A' }}
          >
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4" style={{ color: '#6366F1' }} />
              <span
                className="text-sm font-semibold"
                style={{ color: '#FAFAFA', fontFamily: 'Space Grotesk, DM Sans, sans-serif' }}
              >
                Activity
              </span>
              {/* Live pulse indicator */}
              <span className="relative flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: '#22C55E' }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ background: '#22C55E' }}
                />
              </span>
            </div>
            <button
              onClick={onToggle}
              className="p-1 rounded-md transition-colors"
              style={{ color: '#71717A' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = '#FAFAFA';
                (e.currentTarget as HTMLButtonElement).style.background = '#27272A';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = '#71717A';
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
              aria-label="Close activity feed"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Feed */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <ActivityFeed />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
