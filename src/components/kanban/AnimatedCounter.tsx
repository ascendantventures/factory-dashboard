'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AnimatedCounterProps {
  count: number;
  color?: string;
}

export function AnimatedCounter({ count, color }: AnimatedCounterProps) {
  const [displayed, setDisplayed] = useState(count);
  useEffect(() => {
    setDisplayed(count);
  }, [count]);

  return (
    <motion.span
      key={displayed}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="text-xs px-2 py-0.5 rounded-full font-semibold"
      style={{
        background: color ? `${color}20` : '#27272A',
        color: color ?? '#A1A1AA',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {displayed}
    </motion.span>
  );
}
