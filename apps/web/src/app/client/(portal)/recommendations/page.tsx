'use client';

import { App, Empty, Skeleton } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ClientRecommendationCard from '@/components/client/ClientRecommendationCard';
import type { ClientRecommendation } from '@/components/client/types';
import api from '@/lib/api';

export default function ClientRecommendationsPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ClientRecommendation[]>([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await api.get('/recommendations/client');
        setItems(res.data?.items || res.data?.data?.items || []);
      } catch (error) {
        console.error(error);
        message.error('推荐列表加载失败');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [message]);

  return (
    <div>
      <div className="mb-4">
        <h1 className="m-0 text-xl font-bold">推荐候选人</h1>
        <p className="m-0 mt-1 text-sm text-slate-500">仅展示当前企业范围内的推荐记录</p>
      </div>
      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="grid grid-cols-[1.4fr_1.1fr_160px_140px_80px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500">
          <span>候选人</span>
          <span>岗位</span>
          <span>匹配度</span>
          <span>状态</span>
          <span />
        </div>
        {loading ? (
          <div className="p-4"><Skeleton active /></div>
        ) : items.length === 0 ? (
          <div className="p-10"><Empty /></div>
        ) : (
          items.map((item) => (
            <ClientRecommendationCard
              key={item.id}
              recommendation={item}
              onOpen={() => router.push(`/client/recommendations/${item.id}`)}
            />
          ))
        )}
      </section>
    </div>
  );
}
