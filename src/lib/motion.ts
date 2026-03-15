import { Variants, Transition } from 'framer-motion'

export const transitions = {
  fast: { duration: 0.15, ease: 'easeOut' } as Transition,
  normal: { duration: 0.2, ease: 'easeOut' } as Transition,
  slow: { duration: 0.3, ease: 'easeOut' } as Transition,
  spring: { type: 'spring', stiffness: 400, damping: 30 } as Transition,
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const columnVariants: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.15, ease: 'easeOut' } },
}

export const cardContainerVariants: Variants = {
  animate: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
}

export const cardVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15, ease: 'easeOut' } },
}

export const viewModeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

// Phase 2 (#16) — Tab content, metric cards, timeline nodes
export const tabContentVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.15, ease: [0.25, 1, 0.5, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.1, ease: [0.25, 1, 0.5, 1] },
  },
}

export const metricCardVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.2,
      ease: [0.25, 1, 0.5, 1],
    },
  }),
}

export const timelineNodeVariants: Variants = {
  initial: { opacity: 0, x: -8 },
  animate: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.15,
      ease: [0.25, 1, 0.5, 1],
    },
  }),
}

// Phase 2 (#15) — Page transitions for dashboard routes
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.12, ease: [0.55, 0.085, 0.68, 0.53] },
  },
}
