'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface FunnelLayerProps {
  width: string;
  color: string;
  label: string;
  isLast?: boolean;
}

export const FunnelLayer: React.FC<FunnelLayerProps> = ({ width, color, label, isLast = false }) => (
  <motion.div 
    initial={{ scaleX: 0, opacity: 0 }}
    animate={{ scaleX: 1, opacity: 1 }}
    className="h-10 relative flex items-center justify-center my-1 rounded-sm shadow-lg overflow-hidden group cursor-pointer"
    style={{ width, background: `linear-gradient(90deg, ${color}dd, ${color}88)` }}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-[shimmer_2.5s_infinite]" />
    <span className="relative z-10 text-[11px] font-black text-white/90 tracking-wide">{label}</span>
  </motion.div>
);
