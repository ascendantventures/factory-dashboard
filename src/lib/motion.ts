import { Variants, Transition } from 'framer-motion'

export const transitions = {
  fast: { duration: 0.15, ease: 'easeOut' } as Transition,
  normal: { duration: 0.2, ease: 'easeOut' } as Transition,
  slow: { duration: 0.3, ease: 'easeOut' } as Transition,
  spring: { type: 'spring', stiffness: 400, damping: 30 } as Transition,
}

// ── Notification Center variants ─────────────────────────────────────────────

export const panelVariants: Variants = {
  hidden: { opacity: 0, y: -8, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.2, ease: [0.25, 1, 0.5, 1] },
  },
  exit: {
    opacity: 0, y: -4, scale: 0.98,
    transition: { duration: 0.15, ease: [0.7, 0, 0.84, 0] },
  },
}

export const mobilePanelVariants: Variants = {
  hidden: { opacity: 0, y: '100%' },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] },
  },
  exit: {
    opacity: 0, y: '100%',
    transition: { duration: 0.2, ease: [0.7, 0, 0.84, 0] },
  },
}

export const notificationItemVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1, x: 0,
    transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] },
  },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
}

export const badgeVariants: Variants = {
  initial: { scale: 1 },
  pop: {
    scale: [1, 1.2, 1],
    transition: { duration: 0.2, ease: [0.25, 1, 0.5, 1] },
  },
}

export const savedIndicatorVariants: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.15, ease: [0.25, 1, 0.5, 1] },
  },
  exit: {
    opacity: 0, y: -4,
    transition: { duration: 0.15, delay: 1.5 },
  },
}

export const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
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
