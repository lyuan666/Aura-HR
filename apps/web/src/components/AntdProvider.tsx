'use client';

import '@ant-design/v5-patch-for-react-19';
import React from 'react';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';

const antTheme = {
  token: {
    colorPrimary: '#2563eb', // 更深邃的品牌蓝
    borderRadius: 12,
    fontSize: 14,
    colorLink: '#2563eb',
    colorBgLayout: '#f8fafc',
    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Card: {
      borderRadiusLG: 24,
      colorBgContainer: '#ffffff',
      paddingLG: 24,
      boxShadowTertiary: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
    },
    Button: {
      borderRadius: 10,
      fontWeight: 600,
      controlHeight: 40,
      paddingInline: 20,
    },
    Menu: {
      itemBorderRadius: 10,
      itemHeight: 48,
    },
    Table: {
      borderRadius: 16,
    },
    Input: {
      borderRadius: 10,
      controlHeight: 40,
    }
  }
};

export default function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider locale={zhCN} theme={antTheme}>
      <AntApp>
        {children}
      </AntApp>
    </ConfigProvider>
  );
}
