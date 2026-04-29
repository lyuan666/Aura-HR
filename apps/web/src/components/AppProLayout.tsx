'use client';

import React, { useEffect, useState } from 'react';
import { ProLayout } from '@ant-design/pro-components';
import {
  DashboardOutlined,
  UserOutlined,
  ShopOutlined,
  FileTextOutlined,
  SettingOutlined,
  BellOutlined,
  SearchOutlined,
  AppstoreOutlined,
  SendOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Avatar, Badge, Input } from 'antd';

const menuRoutes = {
  routes: [
    { path: '/dashboard', name: '全景数据（工作台）', icon: <DashboardOutlined /> },
    { path: '/analysis', name: '数据罗盘', icon: <BarChartOutlined /> },
    { path: '/candidates', name: '人才引擎（库）', icon: <UserOutlined /> },
    { path: '/enterprises', name: '客户矩阵', icon: <ShopOutlined /> },
    { path: '/jobs', name: '职位图谱', icon: <AppstoreOutlined /> },
    { path: '/delivery', name: '交付看板', icon: <SendOutlined /> },
    { path: '/contracts', name: '合同管理', icon: <FileTextOutlined /> },
  ],
};

export default function AppProLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ minHeight: '100vh', background: '#121212' }} />;
  }

  return (
    <ProLayout
      title="天选OS"
      logo={<Image src="/logo-tx-v2.png" alt="天选OS" width={36} height={36} style={{ objectFit: 'contain' }} />}
      layout="side"
      navTheme="light"
      fixSiderbar
      fixedHeader
      route={menuRoutes}
      location={{ pathname }}
      menuItemRender={(item, dom) => (
        <div onClick={() => item.path && router.push(item.path)}>{dom}</div>
      )}
      subMenuItemRender={(_, dom) => dom}
      headerTitleRender={(logo, title) => (
        <a onClick={() => router.push('/dashboard')}>
          {logo}
          {title}
        </a>
      )}
      actionsRender={() => [
        <Input.Search
          key="search"
          placeholder="搜索全库..."
          style={{ width: 240 }}
          allowClear
        />,
        <Badge key="bell" count={1} size="small">
          <BellOutlined style={{ fontSize: 18, cursor: 'pointer', color: '#666' }} />
        </Badge>,
        <Avatar
          key="avatar"
          size="small"
          style={{ backgroundColor: '#1677ff', cursor: 'pointer' }}
          onClick={() => router.push('/settings')}
        >
          F
        </Avatar>,
      ]}
      menuFooterRender={() => (
        <div
          style={{ padding: '12px 24px', cursor: 'pointer' }}
          onClick={() => router.push('/settings')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>F</Avatar>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Franklin Jr.</div>
              <div style={{ fontSize: 12, color: '#999' }}>超级管理员</div>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ProLayout>
  );
}
