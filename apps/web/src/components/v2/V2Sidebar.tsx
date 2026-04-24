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
      group flex items-center gap-3 px-4 h-12 rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden
      ${active ? 'bg-white/10 text-white font-bold shadow-inner border border-white/5' : 'text-[#8B8D97] hover:bg-white/5 hover:text-white font-medium border border-transparent'}
      ${isCollapsed ? 'justify-center px-0' : ''}
    `}>
      {active && <motion.div layoutId="nav-bg" className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none" />}
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
        <span className="ml-auto bg-gradient-to-r from-[#FF6B9D] to-[#FF9100] text-white text-[9px] font-black px-2 py-0.5 rounded-full relative z-10 shadow-lg shadow-[#FF6B9D]/30">
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
      className="h-full bg-[#11131A] border-r border-white/5 flex flex-col p-4 shadow-2xl z-20 shrink-0 relative group"
    >
      {/* 折叠切换按钮 */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-12 w-6 h-6 bg-[#6C5CE7] rounded-full flex items-center justify-center text-white shadow-xl shadow-[#6C5CE7]/40 z-30 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div 
        className={`flex items-center gap-3 mb-10 px-2 mt-4 cursor-pointer ${isCollapsed ? 'justify-center px-0' : ''}`} 
        onClick={() => router.push('/dashboard')}
      >
        <div className="relative w-11 h-11 flex-shrink-0">
           <Image src="/logo-tx-v2.png" alt="天选OS Logo" fill sizes="44px" loading="eager" className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
        </div>
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col overflow-hidden"
          >
            <span className="font-black text-lg tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 whitespace-nowrap">天选OS</span>
            <span className="text-[9px] text-[#8B8D97] tracking-widest uppercase mt-[-2px]">Tianxuan</span>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 flex flex-col gap-2 overflow-y-auto overflow-x-hidden pb-4 pr-1 no-scrollbar">
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
        
        {!isCollapsed && <div className="mt-6 mb-2 px-3 text-[10px] font-bold text-[#555762] uppercase tracking-[0.2em]">System</div>}
        <NavItem 
          icon={<RichIcons.Setting />} 
          label="系统调校" 
          isCollapsed={isCollapsed}
          active={activeKey === '/settings'} 
          onClick={() => router.push('/settings')} 
        />
      </nav>

      {/* 用户信息 */}
      <div 
        className={`mt-auto p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0 ${isCollapsed ? 'justify-center' : ''}`} 
        onClick={() => router.push('/settings')}
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF6B9D] to-[#FF9100] flex items-center justify-center text-xs font-black shadow-inner flex-shrink-0">FL</div>
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col overflow-hidden"
          >
            <span className="text-[13px] font-bold text-white/90 whitespace-nowrap">Franklin Jr.</span>
            <span className="text-[10px] text-[#A29BFE]">超级管理员</span>
          </motion.div>
        )}
      </div>
    </motion.aside>
  );
};
