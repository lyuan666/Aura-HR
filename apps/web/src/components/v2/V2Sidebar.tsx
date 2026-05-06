'use client';

import React from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Tooltip } from 'antd';
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  Building2,
  FileText,
  LayoutDashboard,
  PanelsTopLeft,
  Settings,
  UserRoundSearch,
} from 'lucide-react';

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const navItems: NavItem[] = [
  { key: 'dashboard', label: '工作台', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
  { key: 'interviews', label: '面试管理', icon: <CalendarClock size={20} />, path: '/interviews' },
  { key: 'candidates', label: '人才库', icon: <UserRoundSearch size={20} />, path: '/candidates' },
  { key: 'enterprises', label: '客户管理', icon: <Building2 size={20} />, path: '/enterprises' },
  { key: 'jobs', label: '职位管理', icon: <BriefcaseBusiness size={20} />, path: '/jobs' },
  { key: 'delivery', label: '流程看板', icon: <PanelsTopLeft size={20} />, path: '/delivery' },
  { key: 'contracts', label: '合同管理', icon: <FileText size={20} />, path: '/contracts' },
  { key: 'analysis', label: '数据报表', icon: <BarChart3 size={20} />, path: '/analysis' },
];

export const V2Sidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const activeKey = pathname?.split('/')[1] || 'dashboard';

  return (
    <aside className="flex h-full w-[108px] shrink-0 flex-col border-r border-border-subtle bg-bg-surface/95">
      <button
        onClick={() => router.push('/dashboard')}
        className="flex h-[96px] flex-col items-center justify-center gap-2 border-b border-border-subtle"
        aria-label="返回工作台"
      >
        <span className="relative h-9 w-9">
          <Image
            src="/logo-tx-v2.png"
            alt="天选OS"
            fill
            sizes="36px"
            className="object-contain"
            priority
          />
        </span>
        <span className="text-[12px] font-black tracking-tight text-text-main">天选OS</span>
      </button>

      <nav className="flex flex-1 flex-col gap-2 px-2 py-5">
        {navItems.map((item) => {
          const active = activeKey === item.key;
          return (
            <Tooltip key={item.key} title={item.label} placement="right">
              <button
                onClick={() => router.push(item.path)}
                className={[
                  'flex h-[72px] flex-col items-center justify-center gap-1.5 rounded-md border text-[12px] font-medium transition-all',
                  active
                    ? 'border-brand-primary/30 bg-brand-primary/12 text-brand-primary shadow-[inset_3px_0_0_rgba(176,196,222,0.85)]'
                    : 'border-transparent text-text-sub hover:bg-white/5 hover:text-text-main',
                ].join(' ')}
              >
                <span className={active ? 'text-brand-primary' : 'text-text-sub'}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </Tooltip>
          );
        })}
      </nav>

      <div className="border-t border-border-subtle p-2">
        <Tooltip title="系统设置" placement="right">
          <button
            onClick={() => router.push('/settings')}
            className={[
              'flex h-14 w-full flex-col items-center justify-center gap-1 rounded-md border text-[12px] transition-all',
              activeKey === 'settings'
                ? 'border-brand-primary/30 bg-brand-primary/12 text-brand-primary'
                : 'border-transparent text-text-sub hover:bg-white/5 hover:text-text-main',
            ].join(' ')}
          >
            <Settings size={18} />
            <span>设置</span>
          </button>
        </Tooltip>
      </div>
    </aside>
  );
};
