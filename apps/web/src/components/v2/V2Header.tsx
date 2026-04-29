import Image from 'next/image';
import { Search, Bell, HelpCircle, Globe, ChevronDown } from 'lucide-react';
import { Input, Avatar, Tooltip } from 'antd';
import { useRouter } from 'next/navigation';

export const V2Header: React.FC = () => {
  const router = useRouter();

  return (
    <header className="h-[56px] px-4 flex items-center justify-between border-b border-border-subtle bg-bg-surface z-30 sticky top-0 flex-shrink-0">
      {/* 1. Left: Logo & Brand */}
      <div 
        className="flex items-center gap-3 cursor-pointer" 
        onClick={() => router.push('/dashboard')}
      >
        <div className="relative w-8 h-8 flex-shrink-0">
           <Image src="/logo-tx-v2.png" alt="天选OS Logo" fill sizes="32px" loading="eager" className="object-contain" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-[15px] tracking-tight text-text-main whitespace-nowrap">天选OS</span>
          <span className="text-[8px] text-brand-primary tracking-widest uppercase mt-[-2px] opacity-70">Ant Design Pro</span>
        </div>
      </div>

      {/* 2. Right: Grouped Actions (Moved from Sider) */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <Input.Search
          placeholder="搜索全库..."
          className="w-64 ant-input-search-steel"
          allowClear
          onSearch={value => console.log(value)}
          style={{ width: 240 }}
        />

        {/* Notifications */}
        <div className="flex items-center px-2">
          <Badge count={1} size="small" offset={[2, 0]}>
            <Bell size={18} className="text-text-sub cursor-pointer hover:text-text-main transition-colors" />
          </Badge>
        </div>
        
        {/* User Info / Avatar */}
        <div className="flex items-center gap-2.5 cursor-pointer group ml-2">
          <Avatar 
            size={28} 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Serati" 
            className="border border-border-subtle bg-brand-primary"
          >
            F
          </Avatar>
          <span className="text-[13px] font-medium text-text-main group-hover:text-brand-primary transition-colors">Serati Ma</span>
          <ChevronDown size={12} className="text-text-sub/50" />
        </div>

        {/* Global Tools */}
        <div className="flex items-center gap-3 ml-2 border-l border-border-subtle pl-4 text-text-sub">
          <Tooltip title="帮助"><HelpCircle size={16} className="cursor-pointer hover:text-text-main transition-colors" /></Tooltip>
          <Tooltip title="语言"><Globe size={16} className="cursor-pointer hover:text-text-main transition-colors" /></Tooltip>
        </div>
      </div>
    </header>
  );
};

import { Badge } from 'antd';
