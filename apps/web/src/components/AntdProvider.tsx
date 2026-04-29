'use client';

import '@ant-design/v5-patch-for-react-19';
import React from 'react';
import { ConfigProvider, App as AntApp, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';

const antTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#B0C4DE',
    borderRadius: 8,
    fontSize: 14,
    colorLink: '#B0C4DE',
    colorBgLayout: '#121212',
    colorBgContainer: '#1C2128',
    colorBgElevated: '#2D333B',
    colorBorder: 'rgba(205, 217, 229, 0.1)',
    colorText: 'rgba(255, 255, 255, 0.9)',
    colorTextSecondary: '#768390',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  components: {
    Layout: {
      siderBg: '#1C2128',
      headerBg: '#121212',
      bodyBg: '#121212',
    },
    Menu: {
      itemBorderRadius: 4,
      itemHeight: 40,
      itemMarginBlock: 4,
      itemMarginInline: 8,
      activeBarBorderWidth: 0,
      iconSize: 18,
      darkItemSelectedBg: 'rgba(176, 196, 222, 0.1)',
      darkItemSelectedColor: '#B0C4DE',
    },
    Button: {
      borderRadius: 6,
      controlHeight: 36,
      colorPrimary: '#B0C4DE',
      colorPrimaryHover: '#CEDBEB',
    },
    Input: {
      borderRadius: 6,
      controlHeight: 36,
      colorBgContainer: 'rgba(45, 51, 59, 0.5)',
    },
    Card: {
      borderRadiusLG: 8,
      colorBgContainer: 'rgba(28, 33, 40, 0.8)',
      colorBorderSecondary: 'rgba(205, 217, 229, 0.08)',
    },
    Table: {
      borderRadius: 8,
      colorBgContainer: 'rgba(28, 33, 40, 0.5)',
      headerBg: 'rgba(45, 51, 59, 0.3)',
    },
    Modal: {
      borderRadiusLG: 12,
      colorBgElevated: '#1C2128',
    },
    Tooltip: {
      colorBgSpotlight: '#2D333B',
    }
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
