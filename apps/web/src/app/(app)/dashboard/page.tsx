'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Zap, ChevronRight, AlertCircle, Clock, Database, Briefcase, UserCheck, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import { SpotlightCard } from '@/components/v2/SpotlightCard';
import { FunnelLayer } from '@/components/v2/FunnelLayer';
import { App, Skeleton, Empty } from 'antd';

const StatCard = ({ label, value, change, up = true, color, delay, loading }: any) => (
  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, type: "spring", stiffness: 100 }}>
    <SpotlightCard className="p-6 h-full flex flex-col justify-between overflow-hidden relative">
      {loading ? (
        <Skeleton active paragraph={{ rows: 1 }} title={false} />
      ) : (
        <>
          <div className="flex justify-between items-start mb-4">
            <div className="text-[11px] font-bold text-[#8B8D97] tracking-widest uppercase">{label}</div>
            <div className={`text-[10px] font-bold px-2 py-1 rounded-md ${up ? 'text-[#00E676] bg-[#00E676]/10' : 'text-[#FF5252] bg-[#FF5252]/10'}`}>
              {change}
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tighter drop-shadow-md">{value}</div>
          <div className="absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-[0.1] rounded-full mix-blend-screen pointer-events-none" style={{ backgroundColor: color }} />
        </>
      )}
    </SpotlightCard>
  </motion.div>
);

export default function DashboardPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>({
    candidates: [],
    jobs: [],
    stats: {
      candidateCount: 0,
      jobCount: 0,
      recommendationCount: 0,
      acceptedCount: 0
    },
    funnel: []
  });

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [candRes, jobRes, statsRes, funnelRes] = await Promise.allSettled([
        api.get('/candidates'),
        api.get('/job-positions'),
        api.get('/analytics/overview'),
        api.get('/analytics/delivery-funnel')
      ]);

      const newData = {
        candidates: candRes.status === 'fulfilled' ? (candRes.value.data?.items || candRes.value.data) : [],
        jobs: jobRes.status === 'fulfilled' ? (jobRes.value.data?.items || jobRes.value.data) : [],
        stats: statsRes.status === 'fulfilled' ? statsRes.value.data : {
          candidateCount: 0, jobCount: 0, recommendationCount: 0, acceptedCount: 0
        },
        funnel: funnelRes.status === 'fulfilled' ? funnelRes.value.data : []
      };

      setData(newData);
      if (isRefresh) message.success('数据已同步至最新状态');
    } catch (e) {
      console.error('Data pull failed', e);
      message.error('部分数据节点响应异常，请检查网络连接');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [message]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto no-scrollbar pb-10">
      {/* Page Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">运营中心 <span className="text-sm font-normal text-[#555762] ml-2">V2.0.4</span></h1>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${refreshing ? 'bg-amber-400 animate-pulse' : 'bg-[#00E676] shadow-[0_0_10px_#00E676]'}`} />
            <span className="text-[11px] text-[#8B8D97] font-bold uppercase tracking-widest">
              {refreshing ? '正在同步云端节点...' : '核心引擎运行中 · 延迟 14ms'}
            </span>
          </div>
        </div>
        <button 
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 bg-[#1A1D25] border border-white/5 hover:border-[#6C5CE7]/40 hover:bg-[#22252E] px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider text-white transition-all disabled:opacity-50 group"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
          刷新实时看板
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard 
          label="人才库" 
          value={data.stats?.candidateCount || data.candidates?.length || 0} 
          change="+12.4%" 
          color="#6C5CE7" 
          delay={0.1} 
          loading={loading}
        />
        <StatCard 
          label="活跃岗位" 
          value={data.stats?.jobCount || data.jobs?.length || 0} 
          change="+3 新增" 
          color="#00D2FF" 
          delay={0.2} 
          loading={loading}
        />
        <StatCard 
          label="交付中" 
          value={data.stats?.recommendationCount || 0} 
          change="-2.1%" 
          up={false} 
          color="#FF9100" 
          delay={0.3} 
          loading={loading}
        />
        <StatCard 
          label="本月入职" 
          value={data.stats?.acceptedCount || 0} 
          change="+18%" 
          color="#00E676" 
          delay={0.4} 
          loading={loading}
        />
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-5 gap-6">
        
        {/* Left Column (3/5) */}
        <div className="col-span-3 flex flex-col gap-6">
          {/* AI Hero Card */}
          <SpotlightCard className="p-8 relative min-h-[240px] flex flex-col justify-center border-[#6C5CE7]/30 shadow-[0_0_50px_rgba(108,92,231,0.08)] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1145] via-[#0B0D11] to-[#0a2a4a] -z-10 opacity-60" />
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-[#A29BFE] mb-3">
                <Zap size={14} fill="currentColor" className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tianxuan AI Core</span>
              </div>
              <h2 className="text-2xl font-black text-white mb-3 tracking-tight leading-tight">
                基于 <span className="text-[#00D2FF]">200+</span> 行业垂直向量空间<br/>
                深度匹配最佳技术领袖
              </h2>
              <p className="text-xs text-[#8B8D97] max-w-md leading-relaxed mb-8">
                系统已自动根据历史交付数据、简历语义特征和行业人才流向趋势，为您在当前在招岗位中筛选出 5 位高度契合的专家。
              </p>
              <button 
                onClick={() => window.location.href = '/candidates'}
                className="bg-gradient-to-r from-[#6C5CE7] to-[#8E78FF] hover:to-[#6C5CE7] text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-[#6C5CE7]/30 hover:scale-105 active:scale-95"
              >
                进入智能推荐中心 <ChevronRight size={14} />
              </button>
            </div>
          </SpotlightCard>

          {/* 交付漏斗 */}
          <SpotlightCard>
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#1A1D25]/30">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-[#6C5CE7]" />
                <span className="text-xs font-black text-white/90 uppercase tracking-widest">全链路交付漏斗 (Workflow)</span>
              </div>
              <span className="text-[9px] font-bold text-[#555762] bg-white/5 px-2 py-1 rounded-md border border-white/5">近 30 个工作日数据</span>
            </div>
            <div className="p-10 flex flex-col items-center">
              {loading ? (
                <div className="w-full flex flex-col items-center gap-4 py-10">
                  <Skeleton.Input active block style={{ height: 40, background: 'rgba(255,255,255,0.02)' }} />
                  <Skeleton.Input active block style={{ height: 40, width: '80%', background: 'rgba(255,255,255,0.02)' }} />
                  <Skeleton.Input active block style={{ height: 40, width: '60%', background: 'rgba(255,255,255,0.02)' }} />
                </div>
              ) : (
                <div className="relative w-full max-w-[480px] h-[220px] flex flex-col items-center justify-between">
                  <FunnelLayer width="100%" color="#6C5CE7" label={`推荐候选人 (${data.funnel?.find((f: any) => f.name === '已推荐')?.value || 0})`} />
                  <FunnelLayer width="80%" color="#00D2FF" label={`进入面试阶段 (${data.funnel?.find((f: any) => f.name === '面试')?.value || 0})`} />
                  <FunnelLayer width="60%" color="#FF9100" label={`意向 Offer (${data.funnel?.find((f: any) => f.name === 'Offer')?.value || 0})`} />
                  <FunnelLayer width="40%" color="#00E676" label={`成功入职案例 (${data.funnel?.find((f: any) => f.name === '已入职')?.value || 0})`} isLast />
                  
                  {/* 漏斗连接背景 */}
                  <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/[0.03] to-transparent" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 70% 100%, 30% 100%)' }} />
                </div>
              )}
            </div>
          </SpotlightCard>
        </div>

        {/* Right Column (2/5) */}
        <div className="col-span-2 flex flex-col gap-6">
          
          {/* 快捷指标 (Quick Access) */}
          <div className="grid grid-cols-2 gap-3">
             {[
               { n: '待处理面试', v: data.candidates?.filter((c: any) => c.status === 'interviewing')?.length || 0, c: '#6C5CE7', i: <UserCheck size={14} /> },
               { n: '全线在招', v: data.jobs?.filter((j: any) => j.status === 'active')?.length || 0, c: '#00E676', i: <Briefcase size={14} /> },
               { n: '即将到期', v: 0, c: '#FF9100', i: <Clock size={14} /> },
               { n: 'API 节点', v: '正常', c: '#00D2FF', i: <Database size={14} /> },
             ].map((q, i) => (
               <div key={i} className="bg-[#13161C] border border-white/5 hover:border-[#6C5CE7]/30 rounded-2xl p-4 flex flex-col cursor-pointer transition-all hover:bg-[#1A1D25] group">
                 <div className="flex items-center justify-between mb-3">
                   <div className="p-1.5 rounded-lg bg-white/5 text-[#8B8D97] group-hover:text-white transition-colors">{q.i}</div>
                   <span className="text-xl font-black italic tracking-tighter" style={{ color: q.c }}>{q.v}</span>
                 </div>
                 <span className="text-[10px] font-bold text-[#555762] uppercase tracking-widest">{q.n}</span>
               </div>
             ))}
          </div>

          {/* 待办事项 */}
          <SpotlightCard>
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#1A1D25]/30">
              <span className="text-xs font-black text-white/90 uppercase tracking-widest">关键任务提醒</span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            </div>
            <div className="p-3">
               <div className="flex items-start gap-4 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors group">
                 <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                   <AlertCircle size={18} />
                 </div>
                 <div>
                   <div className="text-xs font-bold text-white mb-1">{data.recommendations?.filter((r: any) => r.status === 'pending')[0]?.candidateName || '暂无待办' }</div>
                   <div className="text-[10px] text-[#555762] font-medium flex items-center gap-1">
                     <Clock size={10} /> {data.recommendations?.filter((r: any) => r.status === 'pending')[0]?.jobTitle || '-' }
                   </div>
                 </div>
               </div>
               <div className="flex items-start gap-4 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors group">
                 <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500 group-hover:bg-sky-500 group-hover:text-white transition-all">
                   <Clock size={18} />
                 </div>
                 <div>
                   <div className="text-xs font-bold text-white mb-1">{data.recommendations?.filter((r: any) => r.status === 'pending')[1]?.candidateName || '暂无待办' }</div>
                   <div className="text-[10px] text-[#555762] font-medium flex items-center gap-1">
                     <Clock size={10} /> {data.recommendations?.filter((r: any) => r.status === 'pending')[1]?.jobTitle || '-' }
                   </div>
                 </div>
               </div>
            </div>
          </SpotlightCard>

          {/* 核心客户面板 */}
          <SpotlightCard className="flex-1 min-h-[300px]">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#1A1D25]/30">
              <span className="text-xs font-black text-white/90 uppercase tracking-widest">核心客户实时矩阵</span>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton.Input key={i} active block style={{ height: 50, background: 'rgba(255,255,255,0.02)' }} />)}
                </div>
              ) : data.enterprises?.length > 0 ? (
                <div className="space-y-3">
                  {data.enterprises.slice(0, 5).map((ent: any) => (
                    <div key={ent.id} className="flex items-center gap-4 p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-2xl transition-all cursor-pointer group">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1A1D25] to-[#2A2D35] text-[#A29BFE] flex items-center justify-center text-sm font-black border border-white/10 group-hover:border-[#6C5CE7]/40">
                        {ent.name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-white/90 truncate group-hover:text-[#A29BFE] transition-colors">{ent.name}</div>
                        <div className="text-[10px] text-[#555762] mt-0.5 font-bold uppercase tracking-tight">{ent.industry || 'Tech / Internet'}</div>
                      </div>
                      <div className="px-2 py-0.5 bg-[#00E676]/10 text-[#00E676] rounded text-[9px] font-black uppercase">已签约</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className="text-[10px] font-bold uppercase text-[#555762]">当前无活跃客户同步</span>} />
                </div>
              )}
            </div>
          </SpotlightCard>
        </div>
      </div>
    </motion.div>
  );
}
