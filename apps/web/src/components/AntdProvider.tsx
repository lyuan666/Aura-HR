'use client';

import '@ant-design/v5-patch-for-react-19';
import React, { useState, useEffect } from 'react';
import { ConfigProvider, App as AntApp, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';

const FONT_FAMILY = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

function getAntTheme(isDark: boolean) {
  return {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: isDark ? {
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
      fontFamily: FONT_FAMILY,
    } : {
      colorPrimary: '#3A506B',
      borderRadius: 8,
      fontSize: 14,
      colorLink: '#3A506B',
      colorBgLayout: '#E6E6E6',
      colorBgContainer: '#F0F0F0',
      colorBgElevated: '#FFFFFF',
      colorBorder: 'rgba(58, 80, 107, 0.12)',
      colorText: '#1A1A2E',
      colorTextSecondary: '#3A506B',
      fontFamily: FONT_FAMILY,
    },
    components: {
      Layout: isDark ? {
        siderBg: '#1C2128',
        headerBg: '#121212',
        bodyBg: '#121212',
      } : {
        siderBg: '#F0F0F0',
        headerBg: '#E6E6E6',
        bodyBg: '#E6E6E6',
      },
      Menu: isDark ? {
        itemBorderRadius: 4,
        itemHeight: 40,
        itemMarginBlock: 4,
        itemMarginInline: 8,
        activeBarBorderWidth: 0,
        iconSize: 18,
        darkItemSelectedBg: 'rgba(176, 196, 222, 0.1)',
        darkItemSelectedColor: '#B0C4DE',
      } : {
        itemBorderRadius: 4,
        itemHeight: 40,
        itemMarginBlock: 4,
        itemMarginInline: 8,
        activeBarBorderWidth: 0,
        iconSize: 18,
        itemSelectedBg: 'rgba(58, 80, 107, 0.08)',
        itemSelectedColor: '#3A506B',
        itemHoverColor: '#3A506B',
      },
      Button: {
        borderRadius: 6,
        controlHeight: 36,
        ...(isDark ? {
          colorPrimary: '#B0C4DE',
          colorPrimaryHover: '#CEDBEB',
        } : {
          colorPrimary: '#3A506B',
          colorPrimaryHover: '#4A6A8B',
          defaultBorderColor: 'rgba(58, 80, 107, 0.2)',
        }),
      },
      Input: {
        borderRadius: 6,
        controlHeight: 36,
        ...(isDark ? {
          colorBgContainer: 'rgba(45, 51, 59, 0.5)',
        } : {
          colorBgContainer: '#FFFFFF',
          colorBorder: 'rgba(58, 80, 107, 0.2)',
        }),
      },
      Card: isDark ? {
        borderRadiusLG: 8,
        colorBgContainer: 'rgba(28, 33, 40, 0.8)',
        colorBorderSecondary: 'rgba(205, 217, 229, 0.08)',
      } : {
        borderRadiusLG: 8,
        colorBgContainer: '#FFFFFF',
        colorBorderSecondary: 'rgba(58, 80, 107, 0.08)',
      },
      Table: isDark ? {
        borderRadius: 8,
        colorBgContainer: 'rgba(28, 33, 40, 0.5)',
        headerBg: 'rgba(45, 51, 59, 0.3)',
      } : {
        borderRadius: 8,
        colorBgContainer: '#FFFFFF',
        headerBg: '#F0F0F0',
        headerColor: '#3A506B',
        rowHoverBg: '#CDEDF6',
      },
      Modal: isDark ? {
        borderRadiusLG: 12,
        colorBgElevated: '#1C2128',
      } : {
        borderRadiusLG: 12,
        colorBgElevated: '#FFFFFF',
      },
      Tooltip: {
        colorBgSpotlight: isDark ? '#2D333B' : '#3A506B',
      },
    },
  };
}

function useIsDark() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const resolveTheme = () => {
      const attr = document.documentElement.getAttribute('data-theme');
      if (attr === 'light') return false;
      if (attr === 'dark') return true;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    };

    setIsDark(resolveTheme());

    const observer = new MutationObserver(() => {
      setIsDark(resolveTheme());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setIsDark(resolveTheme());
    mq.addEventListener('change', handler);

    return () => {
      observer.disconnect();
      mq.removeEventListener('change', handler);
    };
  }, []);

  return isDark;
}

export default function AntdProvider({ children }: { children: React.ReactNode }) {
  const isDark = useIsDark();
  const antTheme = getAntTheme(isDark);

  return (
    <ConfigProvider locale={zhCN} theme={antTheme}>
      <AntApp>
        {children}
      </AntApp>
    </ConfigProvider>
  );
}
