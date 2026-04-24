'use client';

import '@ant-design/v5-patch-for-react-19';
import React from 'react';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';

const SF_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif';

const antTheme = {
  token: {
    colorPrimary: '#007AFF',
    borderRadius: 10,
    fontSize: 14,
    colorLink: '#007AFF',
    colorBgLayout: '#F5F5F7',
    fontFamily: SF_FONT,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
    colorText: '#1D1D1F',
    colorTextSecondary: '#8E8E93',
  },
  components: {
    Card: {
      borderRadiusLG: 20,
      colorBgContainer: '#ffffff',
      paddingLG: 24,
      boxShadowTertiary: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
    },
    Button: {
      borderRadius: 10,
      fontWeight: 500,
      controlHeight: 40,
      paddingInline: 20,
      primaryShadow: 'none',
    },
    Menu: {
      itemBorderRadius: 8,
      itemHeight: 40,
      itemMarginBlock: 2,
      itemMarginInline: 10,
      activeBarBorderWidth: 0,
    },
    Table: {
      borderRadius: 16,
    },
    Input: {
      borderRadius: 10,
      controlHeight: 40,
    },
    Select: {
      borderRadius: 10,
    },
    Modal: {
      borderRadiusLG: 16,
    },
    Tag: {
      borderRadiusSM: 8,
    },
  },
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
