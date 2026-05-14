'use client';

import { Alert, App, Empty, Skeleton, Space, Tag } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ClientRecommendationCard from '@/components/client/ClientRecommendationCard';
import type { ClientPortalContext, ClientRecommendation } from '@/components/client/types';
import api from '@/lib/api';

export default function ClientRecommendationsPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ClientRecommendation[]>([]);
  const [portal, setPortal] = useState<ClientPortalContext | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const [portalRes, recommendationRes] = await Promise.all([
          api.get('/recommendations/client/portal'),
          api.get('/recommendations/client'),
        ]);
        setPortal(portalRes.data?.data || portalRes.data);
        setItems(recommendationRes.data?.items || recommendationRes.data?.data?.items || []);
      } catch (error) {
        console.error(error);
        message.error('客户工作台加载失败');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [message]);

  if (loading) return <Skeleton active paragraph={{ rows: 12 }} />;

  const recommendationsEnabled = portal?.enabledModules.includes('recommendations');

  return (
    <div className="space-y-4">
      <section className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="m-0 text-xl font-bold">{portal?.enterprise.name || '客户工作台'}</h1>
            <p className="m-0 mt-1 text-sm text-slate-500">
              {portal?.enterprise.industry || '企业'} · {portal?.enterprise.scale || '规模未录入'}
            </p>
          </div>
          <Space wrap>
            {(portal?.enabledModules || []).map((module) => (
              <Tag key={module} color="blue">{moduleLabel(module)}</Tag>
            ))}
            {portal?.enterprise.status && <Tag>{enterpriseStatusLabel(portal.enterprise.status)}</Tag>}
          </Space>
        </div>
      </section>

      {portal && portal.contracts.length === 0 && (
        <Alert type="warning" showIcon message="当前企业还没有生效合同，客户 HR 权限尚未开通完整模块。" />
      )}

      <section className="grid gap-3 md:grid-cols-5">
        <Metric label="已推荐" value={portal?.stats.totalRecommendations || 0} />
        <Metric label="待查看" value={portal?.stats.submitted || 0} />
        <Metric label="评估中" value={portal?.stats.reviewing || 0} />
        <Metric label="已约面" value={portal?.stats.interviewScheduled || 0} />
        <Metric label="开放职位" value={portal?.jobs.length || 0} />
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <div className="text-sm font-semibold text-slate-950">合同与权限</div>
        </div>
        {(portal?.contracts.length || 0) === 0 ? (
          <div className="p-6 text-sm text-slate-500">暂无合同记录</div>
        ) : (
          portal?.contracts.map((contract) => (
            <div key={contract.id} className="grid grid-cols-[1.2fr_1fr_120px_1.4fr] items-center gap-4 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0">
              <div className="min-w-0">
                <div className="truncate font-semibold text-slate-950">{contract.title}</div>
                <div className="truncate text-xs text-slate-500">{contract.contractNo}</div>
              </div>
              <div className="text-slate-600">{formatDate(contract.startDate)} - {formatDate(contract.endDate)}</div>
              <Tag color={contract.status === 'active' ? 'green' : 'default'}>{contractStatusLabel(contract.status)}</Tag>
              <Space wrap>
                {contract.modules.map((module) => <Tag key={module}>{moduleLabel(module)}</Tag>)}
              </Space>
            </div>
          ))
        )}
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <div className="text-sm font-semibold text-slate-950">推荐简历</div>
          <div className="mt-1 text-xs text-slate-500">只展示推送给当前企业 HR 的候选人</div>
        </div>
        <div className="grid grid-cols-[1.4fr_1.1fr_160px_140px_80px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500">
          <span>候选人</span>
          <span>岗位</span>
          <span>匹配度</span>
          <span>状态</span>
          <span />
        </div>
        {!recommendationsEnabled ? (
          <div className="p-10"><Empty description="合同未开通推荐简历模块" /></div>
        ) : items.length === 0 ? (
          <div className="p-10"><Empty description="暂无推送简历" /></div>
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-950">{value}</div>
    </div>
  );
}

function moduleLabel(module: string) {
  const labels: Record<string, string> = {
    recommendations: '推荐简历',
    feedback: '候选人反馈',
    interviews: '面试协同',
    reports: '报告查看',
  };
  return labels[module] || module;
}

function enterpriseStatusLabel(status: string) {
  const labels: Record<string, string> = {
    signed: '已签约',
    negotiating: '洽谈中',
    following: '跟进中',
    potential: '潜在客户',
    churned: '已流失',
  };
  return labels[status] || status;
}

function contractStatusLabel(status: string) {
  const labels: Record<string, string> = {
    active: '生效中',
    draft: '草稿',
    pending_approval: '待审批',
    completed: '已完成',
    terminated: '已终止',
  };
  return labels[status] || status;
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
}
