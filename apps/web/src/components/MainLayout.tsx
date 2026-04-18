'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, theme, Input, Badge, Button, Space } from 'antd';
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
      // 默认折叠 (true)
      if (saved === null) return true;
      return saved === 'true';
    }
    return true;
  });

  const router = useRouter();
  const pathname = usePathname();
  const { token } = theme.useToken();

  const handleToggleCollapse = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    localStorage.setItem('sidebar-collapsed', String(nextState));
  };

  const activeKey = '/' + (pathname?.split('/')[1] || 'dashboard');

  useEffect(() => {
    // 确保在路由切换时，如果之前是展开状态，则继续保持
    // 此处逻辑已由 useState 保证，仅作保留位置以备后用
  }, [pathname]);

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
        router.push('/login');
      } else if (key === 'settings') {
        router.push('/settings');
      } else if (key === 'profile') {
        router.push('/profile');
      }
    },
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="mophy-sidebar"
        style={{
          background: '#ffffff',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          bottom: 0,
          padding: '16px 0',
          boxShadow: collapsed ? 'none' : '4px 0 24px rgba(0,0,0,0.02)',
          zIndex: 1000,
        }}
        width={260} // 略微增加宽度以提升品质感
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 24px',
            marginBottom: 32,
          }}
        >
          <div style={{ 
            width: 42, height: 42, 
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, color: '#fff',
            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.25)'
          }}>🎯</div>
          {!collapsed && (
            <span style={{ 
              marginLeft: 14, 
              fontSize: 20, 
              fontWeight: 850, 
              color: '#0f172a', 
              letterSpacing: '-0.03em',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>
              YZSCHROS
            </span>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
          style={{ borderRight: 0, padding: '0 12px' }}
          className="custom-mophy-menu"
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <Header
          style={{
            padding: '0 40px',
            background: 'rgba(249, 250, 251, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 88,
            position: 'sticky',
            top: 0,
            zIndex: 999,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, flex: 1 }}>
            <div 
              style={{ 
                cursor: 'pointer', 
                fontSize: 22, 
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '10px',
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }} 
              onClick={handleToggleCollapse}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
            <Input 
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />} 
              placeholder="搜索人才、职位或企业资产..." 
              className="mophy-search-input"
              style={{ 
                width: 420, 
                borderRadius: 14, 
                background: '#fff', 
                border: '1px solid #e2e8f0',
                height: 48,
                fontSize: 14,
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                transition: 'all 0.3s'
              }} 
            />
          </div>
          
          <Space size={24} style={{ display: 'flex', alignItems: 'center' }}>
            <Badge dot color="#6366f1">
              <BellOutlined style={{ fontSize: 20, color: '#64748b', cursor: 'pointer' }} />
            </Badge>
            <Dropdown menu={userMenu} placement="bottomRight" arrow>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, height: 40 }}>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: '2px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>Franklin Jr.</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1 }}>超级管理员</div>
                </div>
                <Avatar 
                  size={40} 
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
                  style={{ 
                    border: '2px solid #fff', 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    display: 'block' 
                  }}
                />
              </div>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ padding: '0 32px 32px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
