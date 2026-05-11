'use client';

import React from 'react';
import { ConfigProvider, theme, App } from 'antd';
import zhCN from 'antd/locale/zh_CN';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#6C5CE7',
          borderRadius: 8,
        },
      }}
    >
      <App>
        <div className="min-h-screen bg-[#0B0D11] text-white">
          {children}
        </div>
      </App>
    </ConfigProvider>
  );
}
