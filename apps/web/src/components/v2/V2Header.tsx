'use client';

import React from 'react';
import { Avatar, Badge, Input, Tooltip } from 'antd';
import { Bell, Download, Search, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const V2Header: React.FC = () => {
  const router = useRouter();

  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-border-subtle bg-bg-base px-6">
      <div className="min-w-[280px] max-w-[520px] flex-1">
        <Input
          size="middle"
          prefix={<Search size={18} className="text-text-sub" />}
          placeholder="在全部简历中搜索"
          className="h-10 rounded-lg border-border-subtle bg-bg-surface/80 text-text-main placeholder:!text-text-sub/60"
        />
      </div>

      <div className="flex items-center gap-4">
        <Tooltip title="下载浏览器插件">
          <button
            onClick={() => router.push('/downloads')}
            className="text-text-sub transition-colors hover:text-text-main"
            aria-label="下载浏览器插件"
          >
            <Download size={18} />
          </button>
        </Tooltip>

        <Tooltip title="邀请协作成员">
          <button className="text-text-sub transition-colors hover:text-text-main" aria-label="邀请协作成员">
            <UserPlus size={18} />
          </button>
        </Tooltip>

        <Tooltip title="通知">
          <Badge count={1} size="small">
            <button className="text-text-sub transition-colors hover:text-text-main" aria-label="通知">
              <Bell size={18} />
            </button>
          </Badge>
        </Tooltip>

        <div className="border-l border-border-subtle pl-4">
          <Avatar
            size={32}
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Serati"
            className="ml-2 border border-border-subtle bg-brand-primary"
            style={{ cursor: 'pointer' }}
            onClick={() => router.push('/settings')}
          >
            M
          </Avatar>
        </div>
      </div>
    </header>
  );
};
