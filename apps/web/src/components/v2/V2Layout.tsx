'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { V2Header } from './V2Header';
import { V2Sidebar } from './V2Sidebar';

export const V2Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-base text-text-main font-sans selection:bg-brand-primary/30">
      <V2Sidebar />

      <div className="min-w-0 flex flex-1 flex-col overflow-hidden">
        <V2Header />
        <main className="relative flex-1 overflow-hidden bg-bg-base">
          <div className="relative z-10 h-full overflow-y-auto px-6 py-3 no-scrollbar">
            <AnimatePresence mode="wait">{children}</AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};
