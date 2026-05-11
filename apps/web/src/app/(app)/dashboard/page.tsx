'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Avatar, Spin, Empty } from 'antd';
import {
  ReloadOutlined,
  UserOutlined,
  SendOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  ShopOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import api from '@/lib/api';
import Link from 'next/link';

function formatTimeAgo(dateStr?: string) {
  if (!dateStr) return '--';
  const ts = new Date(dateStr).getTime();
  if (isNaN(ts)) return '--';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return `${Math.floor(days / 30)}个月前`;
}

/* ── 漏斗图组件 ── */
const FunnelChart = ({ steps }: { steps: { label: string; value: number; color: string }[] }) => {
  const maxVal = Math.max(steps[0]?.value || 1, 1);

  return (
    <div className="flex flex-col items-center gap-1 w-full py-2">
      {steps.map((step, i) => {
        const ratio = Math.max(step.value / maxVal, 0.08);
        const widthPercent = 40 + ratio * 60; // 40% ~ 100%
        const convRate = i > 0 && steps[i - 1].value > 0
          ? Math.round((step.value / steps[i - 1].value) * 100)
          : null;

        return (
          <div key={step.label} className="w-full flex flex-col items-center">
            <div
              className="relative flex items-center justify-center transition-all duration-500"
              style={{
                width: `${widthPercent}%`,
                height: 52,
                background: `linear-gradient(135deg, ${step.color}cc, ${step.color}88)`,
                clipPath: 'polygon(4% 0%, 96% 0%, 100% 100%, 0% 100%)',
                borderRadius: 4,
              }}
            >
              <div className="flex items-center justify-between w-full px-6">
                <span className="text-[13px] font-medium text-white/90">{step.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[18px] font-bold text-white">{step.value}</span>
                  {convRate !== null && (
                    <span className="text-[11px] text-white/60">
                      {convRate}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="text-[10px] text-text-sub/30 my-0.5">
                {step.value > 0 && steps[i + 1].value >= 0 ? `${step.value - steps[i + 1].value} 流失` : ''}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ── 主页面 ── */
export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    candidates: [],
    jobs: [],
    stats: { candidateCount: 0, jobCount: 0, recommendationCount: 0, acceptedCount: 0 },
    funnel: [],
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [candRes, jobRes, statsRes, funnelRes] = await Promise.allSettled([
        api.get('/candidates'),
        api.get('/job-positions'),
        api.get('/analytics/overview'),
        api.get('/analytics/delivery-funnel'),
      ]);

      setData({
        candidates: candRes.status === 'fulfilled' ? (candRes.value.data?.items || candRes.value.data || []) : [],
        jobs: jobRes.status === 'fulfilled' ? (jobRes.value.data?.items || jobRes.value.data || []) : [],
        stats: statsRes.status === 'fulfilled' ? statsRes.value.data : {
          candidateCount: 0, jobCount: 0, recommendationCount: 0, acceptedCount: 0,
        },
        funnel: funnelRes.status === 'fulfilled' ? funnelRes.value.data : [],
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeJobs = data.jobs.filter((j: any) => j.status !== 'closed' && j.status !== 'cancelled').slice(0, 6);

  const recentCandidates = data.candidates.slice(0, 5);

  const funnelSteps = [
    { label: '推荐候选人', value: data.funnel?.find((f: any) => f.name === '已推荐')?.value || 0, color: '#5BC0BE' },
    { label: '进入面试', value: data.funnel?.find((f: any) => f.name === '面试')?.value || 0, color: '#6C5CE7' },
    { label: '意向 Offer', value: data.funnel?.find((f: any) => f.name === 'Offer')?.value || 0, color: '#FF9F43' },
    { label: '成功入职', value: data.funnel?.find((f: any) => f.name === '已入职')?.value || 0, color: '#00D2D3' },
  ];

  const quickLinks = [
    { title: '上传简历', href: '/candidates', icon: <PlusOutlined /> },
    { title: '创建职位', href: '/jobs', icon: <FileTextOutlined /> },
    { title: '交付看板', href: '/delivery', icon: <SendOutlined /> },
    { title: '客户管理', href: '/enterprises', icon: <ShopOutlined /> },
  ];

  const kpiCards = [
    {
      label: '人才库总量',
      value: data.stats?.candidateCount || data.candidates?.length || 0,
      icon: <UserOutlined />,
      color: '#5BC0BE',
    },
    {
      label: '活跃岗位',
      value: data.stats?.jobCount || data.jobs?.length || 0,
      icon: <FileTextOutlined />,
      color: '#6C5CE7',
    },
    {
      label: '累计推荐',
      value: data.stats?.recommendationCount || 0,
      icon: <SendOutlined />,
      color: '#FF9F43',
    },
    {
      label: '成功入职',
      value: data.stats?.acceptedCount || 0,
      icon: <CheckCircleOutlined />,
      color: '#00D2D3',
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[18px] font-bold text-text-main">数据看板</span>
          <span className="text-[12px] text-text-sub/40">全维度招聘数据概览</span>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-hover border border-border-subtle text-[12px] text-text-sub hover:bg-hover-active transition-colors"
        >
          <ReloadOutlined spin={loading} /> 刷新
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            {kpiCards.map((kpi) => (
              <div
                key={kpi.label}
                className="bg-bg-surface border border-border-subtle rounded-xl p-5 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-text-sub/60 font-medium">{kpi.label}</span>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px]"
                    style={{ backgroundColor: `${kpi.color}20`, color: kpi.color }}
                  >
                    {kpi.icon}
                  </div>
                </div>
                <span className="text-[28px] font-bold text-text-main">{kpi.value}</span>
              </div>
            ))}
          </div>

          {/* Main Content: 2 columns */}
          <div className="grid grid-cols-3 gap-6">
            {/* Left: Funnel + Jobs */}
            <div className="col-span-2 flex flex-col gap-6">
              {/* Delivery Funnel */}
              <div className="bg-bg-surface border border-border-subtle rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-brand-primary rounded-sm" />
                    <span className="text-[15px] font-bold text-text-main">全链路交付漏斗</span>
                  </div>
                  <span className="text-[11px] text-text-sub/40">近 30 天</span>
                </div>
                <FunnelChart steps={funnelSteps} />
              </div>

              {/* Active Jobs */}
              <div className="bg-bg-surface border border-border-subtle rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-brand-primary rounded-sm" />
                    <span className="text-[15px] font-bold text-text-main">进行中的招聘项目</span>
                  </div>
                  <Link href="/jobs" className="text-[12px] text-brand-primary hover:underline">
                    全部职位
                  </Link>
                </div>
                {activeJobs.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {activeJobs.map((job: any) => (
                      <Link
                        key={job.id}
                        href={`/jobs/${job.id}`}
                        className="bg-bg-elevated/30 border border-border-subtle rounded-lg p-4 hover:border-brand-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar size={24} className="bg-brand-primary/20 text-brand-primary text-[10px]">
                            {job.enterprise?.name?.[0] || 'J'}
                          </Avatar>
                          <span className="text-[14px] font-medium text-text-main truncate">
                            {job.title || '未命名职位'}
                          </span>
                        </div>
                        <div className="text-[12px] text-text-sub/50">
                          {job.enterprise?.name || '未知企业'} · {job.location || '--'}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={<span className="text-text-sub/30 text-[12px]">暂无进行中的招聘项目</span>}
                  />
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="flex flex-col gap-6">
              {/* Quick Links */}
              <div className="bg-bg-surface border border-border-subtle rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-brand-primary rounded-sm" />
                  <span className="text-[15px] font-bold text-text-main">快速开始</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {quickLinks.map((link) => (
                    <Link
                      key={link.title}
                      href={link.href}
                      className="flex flex-col items-center gap-2 py-3 rounded-lg bg-bg-elevated/20 border border-border-subtle hover:border-brand-primary/30 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center text-[16px]">
                        {link.icon}
                      </div>
                      <span className="text-[12px] text-text-sub">{link.title}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Recent Candidates */}
              <div className="bg-bg-surface border border-border-subtle rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-brand-primary rounded-sm" />
                    <span className="text-[15px] font-bold text-text-main">最新入库</span>
                  </div>
                  <Link href="/candidates" className="text-[12px] text-brand-primary hover:underline">
                    全部人才
                  </Link>
                </div>
                {recentCandidates.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {recentCandidates.map((c: any) => (
                      <div key={c.id} className="flex items-center gap-3">
                        <Avatar size={28} className="bg-bg-elevated text-text-sub text-[11px]">
                          {c.name?.[0] || '?'}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] text-text-main truncate">{c.name || '未知'}</div>
                          <div className="text-[11px] text-text-sub/40">
                            {c.currentTitle || c.degree || '--'}
                          </div>
                        </div>
                        <span className="text-[11px] text-text-sub/30 shrink-0">
                          {formatTimeAgo(c.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={<span className="text-text-sub/30 text-[12px]">暂无候选人</span>}
                  />
                )}
              </div>

              {/* AI Insight Card */}
              <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ThunderboltOutlined className="text-brand-primary text-[14px]" />
                  <span className="text-[13px] font-medium text-brand-primary">AI 洞察</span>
                </div>
                <p className="text-[12px] text-text-sub/60 leading-5 m-0">
                  {data.candidates.length > 0
                    ? `当前人才库共 ${data.candidates.length} 位候选人，${activeJobs.length} 个活跃岗位。建议优先推进已有推荐的交付流程。`
                    : '上传简历开始构建人才库，AI 将自动解析简历并提取关键信息。'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
