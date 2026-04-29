'use client';

import React from 'react';
import { V2Sidebar } from './V2Sidebar';
import { V2Header } from './V2Header';
import Image from 'next/image';
import { AnimatePresence } from 'framer-motion';

export const V2Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen w-screen bg-bg-base text-text-main font-sans selection:bg-brand-primary/30 overflow-hidden">
      {/* 顶部导航栏 - 固定高度，横跨全屏 */}
      <V2Header />

      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏 - 贴紧左侧 */}
        <V2Sidebar />

        {/* 主内容区 - 独立滚动 */}
        <main className="flex-1 overflow-hidden relative flex flex-col">
          {/* 背景大水印 */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.015] z-0 overflow-hidden">
            <div className="relative w-[800px] h-[800px]">
              <Image src="/logo-tx-v2.png" alt="Watermark" fill sizes="800px" className="grayscale object-contain" />
            </div>
          </div>
          
          <div className="flex-1 p-8 overflow-y-auto relative z-10 no-scrollbar">
            <AnimatePresence mode="wait">
              {children}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};
