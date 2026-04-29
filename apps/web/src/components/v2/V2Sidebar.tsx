'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { RichIcons } from './RichIcons';
import { Tooltip } from 'antd';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
  isCollapsed: boolean;
  onClick: () => void;
}

const NavItem = ({ icon, label, active = false, badge = undefined, isCollapsed, onClick }: NavItemProps) => (
  <Tooltip title={isCollapsed ? label : ""} placement="right">
    <div onClick={onClick} className={`
      group flex items-center gap-3 px-4 h-12 rounded-lg cursor-pointer transition-all duration-200 relative
      ${active ? 'bg-brand-primary/10 text-brand-primary font-bold border border-brand-primary/20' : 'text-text-sub hover:bg-white/5 hover:text-text-main font-medium border border-transparent'}
      ${isCollapsed ? 'justify-center px-0' : ''}
    `}>
      <div className={`relative z-10 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      
      {!isCollapsed && (
        <motion.span 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-[13px] relative z-10 whitespace-nowrap"
        >
          {label}
        </motion.span>
      )}

      {!isCollapsed && badge && (
        <span className="ml-auto bg-brand-primary/20 text-brand-primary text-[9px] font-black px-2 py-0.5 rounded-md border border-brand-primary/30">
          {badge}
        </span>
      )}
    </div>
  </Tooltip>
);

export const V2Sidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { key: '/dashboard', icon: <RichIcons.Dashboard />, label: '全景数据 (工作台)' },
    { key: '/candidates', icon: <RichIcons.Talent />, label: '人才引擎 (库)', badge: 'New' },
    { key: '/enterprises', icon: <RichIcons.Client />, label: '客户矩阵' },
    { key: '/jobs', icon: <RichIcons.Job />, label: '职位图谱' },
    { key: '/delivery', icon: <RichIcons.Delivery />, label: '交付看板' },
    { key: '/contracts', icon: <RichIcons.Contract />, label: '合同管理' },
  ];

  const activeKey = '/' + (pathname?.split('/')[1] || 'dashboard');

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 260 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="h-full bg-bg-base border-r border-border-subtle flex flex-col p-4 z-20 shrink-0 relative group"
    >
      {/* 折叠切换按钮 */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-4 w-6 h-6 bg-brand-primary rounded-md flex items-center justify-center text-bg-base shadow-lg z-30 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <nav className="flex-1 flex flex-col gap-2 overflow-y-auto overflow-x-hidden pt-4 pb-4 pr-1 no-scrollbar">
        {menuItems.map((item) => (
          <NavItem 
            key={item.key}
            icon={item.icon} 
            label={item.label} 
            isCollapsed={isCollapsed}
            active={activeKey === item.key} 
            onClick={() => router.push(item.key)} 
            badge={item.badge}
          />
        ))}
        
        {!isCollapsed && <div className="mt-6 mb-2 px-3 text-[10px] font-bold text-text-sub/60 uppercase tracking-[0.2em]">System</div>}
        <NavItem 
          icon={<RichIcons.Setting />} 
          label="系统调校" 
          isCollapsed={isCollapsed}
          active={activeKey === '/settings'} 
          onClick={() => router.push('/settings')} 
        />
      </nav>
    </motion.aside>
  );
};
