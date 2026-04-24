'use client';

import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Input, Badge, Space } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  BankOutlined,
  FileSearchOutlined,
  ProjectOutlined,
  FileTextOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SearchOutlined,
  BellOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
  { key: '/candidates', icon: <TeamOutlined />, label: '人才管理' },
  { key: '/enterprises', icon: <BankOutlined />, label: '客户管理' },
  { key: '/jobs', icon: <FileSearchOutlined />, label: '岗位管理' },
  { key: '/delivery', icon: <ProjectOutlined />, label: '交付管理' },
  { key: '/contracts', icon: <FileTextOutlined />, label: '合同管理' },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved === null) return true;
      return saved === 'true';
    }
    return true;
  });

  const router = useRouter();
  const pathname = usePathname();

  const handleToggleCollapse = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    localStorage.setItem('sidebar-collapsed', String(nextState));
  };

  const activeKey = '/' + (pathname?.split('/')[1] || 'dashboard');

  const userMenu = {
    items: [
      { key: 'settings', icon: <SettingOutlined />, label: '系统设置' },
      { key: 'profile', icon: <UserOutlined />, label: '个人信息' },
      { key: 'help', icon: <QuestionCircleOutlined />, label: '帮助中心' },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'logout') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
        router.push('/login');
      } else if (key === 'settings') {
        router.push('/settings');
      } else if (key === 'profile') {
        router.push('/profile');
      }
    },
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#F5F5F7' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="glass-sidebar"
        style={{
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          bottom: 0,
          padding: '12px 0',
          borderRight: '1px solid rgba(0, 0, 0, 0.06)',
          zIndex: 1000,
        }}
        width={260}
      >
        {/* Logo */}
        <div
          style={{
            height: 52,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 20px',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
            }}
          >
            <img src="/logo.png" alt="天选OS" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          {!collapsed && (
            <span
              style={{
                marginLeft: 12,
                fontSize: 18,
                fontWeight: 800,
                color: '#1D1D1F',
                letterSpacing: '-0.02em',
              }}
            >
              天选OS
            </span>
          )}
        </div>

        {/* Menu */}
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
          style={{ borderRight: 0, padding: '0 8px' }}
          className="apple-menu"
        />
      </Sider>

      <Layout
        style={{
          marginLeft: collapsed ? 80 : 260,
          transition: 'margin-left 0.25s ease',
        }}
      >
        {/* Header */}
        <Header
          style={{
            padding: '0 32px',
            background: 'rgba(245, 245, 247, 0.72)',
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
            position: 'sticky',
            top: 0,
            zIndex: 999,
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
            {/* Collapse toggle */}
            <div
              style={{
                cursor: 'pointer',
                fontSize: 18,
                color: '#8E8E93',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 8,
                transition: 'background 0.15s ease',
              }}
              onClick={handleToggleCollapse}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F2F2F7')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>

            {/* Search */}
            <Input
              prefix={<SearchOutlined style={{ color: '#C7C7CC' }} />}
              placeholder="搜索人才、职位或企业..."
              style={{
                width: 360,
                borderRadius: 10,
                background: '#F2F2F7',
                border: '1px solid transparent',
                height: 40,
                fontSize: 14,
              }}
            />
          </div>

          <Space size={20} style={{ display: 'flex', alignItems: 'center' }}>
            <Badge dot color="#007AFF" style={{ boxShadow: 'none' }}>
              <BellOutlined style={{ fontSize: 18, color: '#8E8E93', cursor: 'pointer' }} />
            </Badge>
            <Dropdown menu={userMenu} placement="bottomRight" arrow>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1D1D1F', lineHeight: 1.2 }}>Franklin Jr.</div>
                  <div style={{ fontSize: 11, color: '#8E8E93', lineHeight: 1.2 }}>超级管理员</div>
                </div>
                <Avatar
                  size={36}
                  style={{
                    backgroundColor: '#007AFF',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  F
                </Avatar>
              </div>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ padding: '0 28px 28px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
