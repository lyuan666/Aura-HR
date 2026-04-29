'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({ children, className = "" }) => {
  return (
    <motion.div
      className={`relative bg-bg-surface/80 backdrop-blur-md border border-border-subtle rounded-lg overflow-hidden transition-all duration-300 hover:border-brand-primary/40 ${className}`}
    >
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};
