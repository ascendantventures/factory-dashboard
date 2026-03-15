'use client';

import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SyncState } from '@/lib/kanban-prefs-context';

interface SavingIndicatorProps {
  syncState: SyncState;
}

const savingIndicatorVariants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

export function SavingIndicator({ syncState }: SavingIndicatorProps) {
  const isVisible = syncState !== 'idle';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          data-testid="saving-indicator"
          data-state={syncState}
          key={syncState}
          variants={savingIndicatorVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="flex items-center gap-1.5"
          style={{
            fontSize: '12px',
            fontWeight: 500,
            fontFamily: 'Inter, sans-serif',
            height: '24px',
            padding: '0 8px',
            borderRadius: '6px',
            color:
              syncState === 'saving'
                ? '#F59E0B'
                : syncState === 'saved'
                ? '#22C55E'
                : '#EF4444',
            background: syncState === 'error' ? 'rgba(239,68,68,0.1)' : 'transparent',
          }}
        >
          {syncState === 'saving' && (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
              <span>Saving...</span>
            </>
          )}
          {syncState === 'saved' && (
            <>
              <Check className="w-3.5 h-3.5" strokeWidth={2} />
              <span>Saved</span>
            </>
          )}
          {syncState === 'error' && (
            <>
              <AlertCircle className="w-3.5 h-3.5" strokeWidth={2} />
              <span>Failed to save</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
