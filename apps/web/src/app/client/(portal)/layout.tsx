'use client';

import { Button } from 'antd';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
    router.replace('/client/login');
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div>
            <div className="text-sm font-bold">天选OS 客户门户</div>
            <div className="text-xs text-slate-500">推荐候选人协作台</div>
          </div>
          <Button icon={<LogOut size={14} />} onClick={logout}>
            退出
          </Button>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-6">{children}</div>
    </main>
  );
}
