'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Avatar, Spin, Empty, Tag } from 'antd';
import {
  ReloadOutlined,
  UserOutlined,
  FileTextOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import api from '@/lib/api';
import Link from 'next/link';

/* ── 漏斗图组件 ── */
const FunnelChart = ({ steps }: { steps: { label: string; value: number; color: string }[] }) => {
  const maxVal = Math.max(steps[0]?.value || 1, 1);

  return (
    <div className="flex flex-col items-center gap-1 w-full py-2">
      {steps.map((step, i) => {
        const ratio = Math.max(step.value / maxVal, 0.08);
        const widthPercent = 40 + ratio * 60;
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
                    <span className="text-[11px] text-white/60">{convRate}%</span>
                  )}
                </div>
              </div>
            </div>
            {i < steps.length - 1 && step.value > 0 && (
              <div className="text-[10px] text-text-sub/30 my-0.5">
                {step.value - steps[i + 1].value > 0 ? `${step.value - steps[i + 1].value} 流失` : ''}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default function AnalysisPage() {
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

  const funnelSteps = [
    { label: '推荐候选人', value: data.funnel?.find((f: any) => f.name === '已推荐')?.value || 0, color: '#5BC0BE' },
    { label: '进入面试', value: data.funnel?.find((f: any) => f.name === '面试')?.value || 0, color: '#6C5CE7' },
    { label: '意向 Offer', value: data.funnel?.find((f: any) => f.name === 'Offer')?.value || 0, color: '#FF9F43' },
    { label: '成功入职', value: data.funnel?.find((f: any) => f.name === '已入职')?.value || 0, color: '#00D2D3' },
  ];

  // 从真实数据统计候选人状态分布
  const statusDistribution = (() => {
    const statusMap: Record<string, { label: string; color: string }> = {
      new: { label: '新简历', color: '#5BC0BE' },
      active: { label: '活跃', color: '#6C5CE7' },
      in_process: { label: '面试中', color: '#FF9F43' },
      offered: { label: 'Offer', color: '#FAAD14' },
      placed: { label: '已入职', color: '#00D2D3' },
      inactive: { label: '不活跃', color: '#636E72' },
    };
    const counts: Record<string, number> = {};
    data.candidates.forEach((c: any) => {
      const s = c.status || 'new';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([key, value]) => ({
        key,
        ...statusMap[key] || { label: key, color: '#636E72' },
        value,
      }))
      .sort((a, b) => b.value - a.value);
  })();

  // 职位统计
  const jobStats = (() => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: '待处理', color: '#636E72' },
      matching: { label: '匹配中', color: '#5BC0BE' },
      recommending: { label: '推荐中', color: '#6C5CE7' },
      interviewing: { label: '面试中', color: '#FF9F43' },
      closed: { label: '已关闭', color: '#52c41a' },
      cancelled: { label: '已取消', color: '#FF4D4F' },
    };
    const counts: Record<string, number> = {};
    data.jobs.forEach((j: any) => {
      const s = j.status || 'pending';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([key, value]) => ({
        key,
        ...statusMap[key] || { label: key, color: '#636E72' },
        value,
      }))
      .sort((a, b) => b.value - a.value);
  })();

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
          <span className="text-[18px] font-bold text-text-main">数据罗盘</span>
          <span className="text-[12px] text-text-sub/40">全维度数据分析与洞察</span>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-hover border border-border-subtle text-[12px] text-text-sub hover:bg-hover-active transition-colors"
        >
          <ReloadOutlined spin={loading} /> 刷新数据
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

          {/* Funnel + Status Distribution */}
          <div className="grid grid-cols-3 gap-6">
            {/* Delivery Funnel */}
            <div className="col-span-2 bg-bg-surface border border-border-subtle rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-brand-primary rounded-sm" />
                  <span className="text-[15px] font-bold text-text-main">全链路交付漏斗</span>
                </div>
                <span className="text-[11px] text-text-sub/40">近 30 天</span>
              </div>
              <FunnelChart steps={funnelSteps} />
            </div>

            {/* Candidate Status Distribution */}
            <div className="bg-bg-surface border border-border-subtle rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-brand-primary rounded-sm" />
                <span className="text-[15px] font-bold text-text-main">候选人状态分布</span>
              </div>
              {statusDistribution.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {statusDistribution.map((item) => {
                    const total = data.candidates.length || 1;
                    const percent = Math.round((item.value / total) * 100);
                    return (
                      <div key={item.key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[13px] text-text-main">{item.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-bold" style={{ color: item.color }}>
                              {item.value}
                            </span>
                            <span className="text-[11px] text-text-sub/40">{percent}%</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-bg-elevated/30 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<span className="text-text-sub/30 text-[12px]">暂无数据</span>}
                />
              )}
            </div>
          </div>

          {/* Job Stats + Job List */}
          <div className="grid grid-cols-3 gap-6">
            {/* Job Status */}
            <div className="bg-bg-surface border border-border-subtle rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-brand-primary rounded-sm" />
                <span className="text-[15px] font-bold text-text-main">职位状态分布</span>
              </div>
              {jobStats.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {jobStats.map((item) => {
                    const total = data.jobs.length || 1;
                    const percent = Math.round((item.value / total) * 100);
                    return (
                      <div key={item.key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[13px] text-text-main">{item.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-bold" style={{ color: item.color }}>
                              {item.value}
                            </span>
                            <span className="text-[11px] text-text-sub/40">{percent}%</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-bg-elevated/30 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<span className="text-text-sub/30 text-[12px]">暂无职位数据</span>}
                />
              )}
            </div>

            {/* Job List */}
            <div className="col-span-2 bg-bg-surface border border-border-subtle rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-brand-primary rounded-sm" />
                  <span className="text-[15px] font-bold text-text-main">职位招聘概览</span>
                </div>
                <Link href="/jobs" className="text-[12px] text-brand-primary hover:underline">
                  查看全部
                </Link>
              </div>
              {data.jobs.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {data.jobs.slice(0, 6).map((job: any) => (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-elevated/20 transition-colors"
                    >
                      <Avatar size={28} className="bg-brand-primary/20 text-brand-primary text-[10px] shrink-0">
                        {job.enterprise?.name?.[0] || 'J'}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-text-main font-medium truncate">{job.title || '未命名'}</div>
                        <div className="text-[11px] text-text-sub/40">{job.enterprise?.name || '--'}</div>
                      </div>
                      <span className="text-[12px] text-text-sub/50 shrink-0">{job.candidateCount || 0} 人</span>
                      {job.salaryMin && (
                        <span className="text-[11px] text-text-sub/30 shrink-0">
                          {job.salaryMin}-{job.salaryMax}K
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<span className="text-text-sub/30 text-[12px]">暂无职位数据</span>}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
