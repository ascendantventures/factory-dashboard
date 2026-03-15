'use client';

import { useRef, useState, useEffect } from 'react';
import { Columns3, RotateCcw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { STATIONS, STATION_COLORS, STATION_LABELS, type Station } from '@/lib/constants';
import { useKanbanPrefs } from '@/lib/kanban-prefs-context';

const popoverVariants = {
  initial: { opacity: 0, y: -8, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.15, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, scale: 0.95, transition: { duration: 0.1 } },
};

export function ColumnVisibilityMenu() {
  const { columnOrder, hiddenColumns, toggleHidden, reset } = useKanbanPrefs();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const visibleCount = columnOrder.length - hiddenColumns.length;
  const displayOrder = columnOrder.length > 0 ? columnOrder : [...STATIONS];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        aria-label="Columns menu"
        data-testid="columns-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={{
          background: open ? 'rgba(99,102,241,0.12)' : 'transparent',
          color: open ? '#818CF8' : '#A1A1AA',
          border: `1px solid ${open ? '#6366F1' : '#27272A'}`,
        }}
      >
        <Columns3 className="w-3.5 h-3.5" strokeWidth={2} />
        <span>Columns</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            variants={popoverVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              background: '#18181B',
              border: '1px solid #27272A',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5), 0 6px 10px rgba(0,0,0,0.3)',
              minWidth: '220px',
              maxHeight: '360px',
              overflowY: 'auto',
              zIndex: 50,
              padding: '8px 0',
            }}
          >
            {/* Section header */}
            <div
              style={{
                padding: '8px 16px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#71717A',
                fontFamily: 'Inter, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Show / Hide Columns
            </div>

            {displayOrder.map((station) => {
              const isChecked = !hiddenColumns.includes(station as Station);
              const isLast = isChecked && visibleCount <= 1;
              const color = STATION_COLORS[station as Station];
              const label = STATION_LABELS[station as Station] ?? station;

              return (
                <ColumnMenuItem
                  key={station}
                  station={station as Station}
                  label={label}
                  color={color}
                  isChecked={isChecked}
                  isDisabled={isLast}
                  onToggle={() => toggleHidden(station as Station)}
                />
              );
            })}

            {/* Divider */}
            <div style={{ height: '1px', background: '#27272A', margin: '8px 0' }} />

            {/* Reset layout */}
            <button
              data-action="reset-layout"
              data-testid="reset-layout"
              onClick={() => {
                reset();
                setOpen(false);
              }}
              className="flex items-center gap-2 w-full transition-all"
              style={{
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#6366F1',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
              Reset layout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ColumnMenuItem({
  station,
  label,
  color,
  isChecked,
  isDisabled,
  onToggle,
}: {
  station: Station;
  label: string;
  color: string;
  isChecked: boolean;
  isDisabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      data-column={station}
      data-testid={`column-visibility-item`}
      onClick={isDisabled ? undefined : onToggle}
      className="flex items-center gap-3"
      style={{
        padding: '10px 16px',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.4 : 1,
        transition: 'background 150ms ease',
        pointerEvents: isDisabled ? 'none' : undefined,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) (e.currentTarget as HTMLElement).style.background = '#27272A';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      {/* Color dot */}
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
        }}
      />

      {/* Label */}
      <span
        style={{
          flex: 1,
          fontSize: '14px',
          color: '#FAFAFA',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {label}
      </span>

      {/* Checkbox */}
      <div
        data-testid={`column-checkbox-${station}`}
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '4px',
          border: isChecked ? '2px solid #6366F1' : '2px solid #3F3F46',
          background: isChecked ? '#6366F1' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 150ms ease',
        }}
      >
        <AnimatePresence>
          {isChecked && (
            <motion.div
              key="check"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 500, damping: 25 } }}
              exit={{ scale: 0, opacity: 0, transition: { duration: 0.1 } }}
            >
              <Check className="w-3 h-3" style={{ color: '#fff' }} strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden input for Playwright targeting */}
      <input
        type="checkbox"
        checked={isChecked}
        disabled={isDisabled}
        onChange={isDisabled ? undefined : onToggle}
        aria-label={`Toggle ${label} column`}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
        readOnly={isDisabled}
      />
    </div>
  );
}
