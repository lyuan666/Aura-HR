'use client';

import React from 'react';
import { V2Sidebar } from './V2Sidebar';
import { V2Header } from './V2Header';
import Image from 'next/image';
import { AnimatePresence } from 'framer-motion';

export const V2Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen w-screen bg-[#0B0D11] text-[#F0F0F2] font-sans selection:bg-[#6C5CE7]/30 overflow-hidden">
      <V2Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* 背景大水印 (极致沉浸) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.02] z-0 mix-blend-screen overflow-hidden">
          <div className="relative w-[1200px] h-[1200px]">
            <Image src="/logo-tx-v2.png" alt="Watermark" fill sizes="1200px" className="grayscale object-contain" />
          </div>
        </div>
        
        <V2Header />
        
        <div className="flex-1 p-8 overflow-y-auto relative z-10 no-scrollbar">
          <AnimatePresence mode="wait">
            {children}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
