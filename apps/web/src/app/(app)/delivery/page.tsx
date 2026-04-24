'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, Share2, User, Calendar, Send, 
  ChevronRight, MoreHorizontal, CheckCircle2, Zap, TrendingUp, Search, Filter, Briefcase
} from 'lucide-react';
import api from '@/lib/api';
import { SpotlightCard } from '@/components/v2/SpotlightCard';
import CandidateDetailDrawer from '@/components/candidates/CandidateDetailDrawer';
import { App, Avatar, Badge, DatePicker, Tooltip, Select, Modal, Skeleton, Empty } from 'antd';
import dayjs from 'dayjs';

const STATUS_CONFIG: Record<string, { label: string, color: string, desc: string }> = {
  pending: { label: '待初筛', color: '#8B8D97', desc: '新流入的人才节点' },
  submitted: { label: '已推荐', color: '#6C5CE7', desc: '简历已送达决策层' },
  reviewing: { label: '企业评估', color: '#FF9100', desc: '用人部门正在审阅' },
  interview_scheduled: { label: '约面中', color: '#00D2FF', desc: '面试链路已开启' },
  offer_sent: { label: '发Offer', color: '#AF52DE', desc: '进入录用签约环节' },
  accepted: { label: '已入职', color: '#00E676', desc: '节点交付成功' },
};

export default function DeliveryPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/recommendations');
      setData(res.data?.items || []);
    } catch (e) {
      console.error(e);
      message.error('交付矩阵节点同步失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(rec => 
      !searchQuery || 
      [rec.candidate?.name, rec.jobPosition?.title].some(f => f?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [data, searchQuery]);

  const handleCardClick = (candidate: any) => {
    setSelectedCandidate(candidate);
    setIsDrawerOpen(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full overflow-hidden pb-6">
      {/* Kanban Header */}
      <div className="flex items-end justify-between mb-8 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">交付看板 <span className="text-sm font-normal text-[#555762] ml-2">Pipeline</span></h1>
          <div className="flex items-center gap-3 mt-1">
             <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-[#6C5CE7] shadow-[0_0_8px_#6C5CE7]" />
               <span className="text-[10px] text-[#8B8D97] font-black uppercase tracking-widest">Real-time Delivery Sync</span>
             </div>
             <span className="text-[10px] text-[#555762] font-bold uppercase tracking-wider">最后同步于: {dayjs().format('HH:mm:ss')}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="relative group mr-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555762] group-focus-within:text-[#6C5CE7] transition-colors" size={14} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="快速索引候选人或职位..." 
              className="bg-[#13161C] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-[10px] w-48 focus:w-64 focus:border-[#6C5CE7]/50 focus:outline-none text-white transition-all placeholder:text-[#555762]" 
            />
          </div>
          <button className="bg-white/5 border border-white/10 hover:bg-white/10 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest text-white/80 flex items-center gap-2 transition-all">
            <Share2 size={14} /> 导出流转报告
          </button>
          <button className="bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] text-white px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-[#6C5CE7]/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
            <Zap size={14} className="fill-current" /> AI 智能催办
          </button>
        </div>
      </div>

      {/* Kanban Body */}
      <div className="flex-1 overflow-x-auto no-scrollbar flex gap-6 items-start">
        {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => (
          <div key={statusKey} className="w-80 shrink-0 flex flex-col h-full group">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-6 px-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color, boxShadow: `0 0 10px ${config.color}` }} />
                  <span className="text-xs font-black text-white uppercase tracking-[0.2em]">{config.label}</span>
                  <span className="bg-white/5 text-[#8B8D97] text-[10px] font-black px-2 py-0.5 rounded-md border border-white/5">
                    {filteredData.filter(r => r.status === statusKey).length}
                  </span>
                </div>
                <span className="text-[9px] text-[#555762] font-black uppercase tracking-widest ml-4">{config.desc}</span>
              </div>
              <button className="text-[#555762] hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-lg"><MoreHorizontal size={16} /></button>
            </div>

            {/* Column Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-10">
              {loading ? (
                [1, 2].map(i => (
                  <SpotlightCard key={i} className="p-5 h-40"><Skeleton active paragraph={{ rows: 2 }} title={false} avatar /></SpotlightCard>
                ))
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredData
                    .filter(r => r.status === statusKey)
                    .map((rec, i) => (
                      <motion.div
                        key={rec.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, x: -20 }}
                        transition={{ duration: 0.2, delay: i * 0.05 }}
                        onClick={() => handleCardClick(rec.candidate)}
                        className="cursor-pointer"
                      >
                        <SpotlightCard className="p-5 group/card hover:border-[#6C5CE7]/30 transition-all border border-white/5 shadow-xl">
                          <div className="flex justify-between items-start mb-5">
                            <div className="flex items-center gap-4">
                              <Avatar 
                                src={rec.candidate?.avatar} 
                                size={44} 
                                className="rounded-2xl border-2 border-white/5 shadow-2xl ring-1 ring-white/10 group-hover/card:ring-[#6C5CE7]/50 transition-all"
                              >
                                {rec.candidate?.name?.[0]}
                              </Avatar>
                              <div>
                                <div className="text-[13px] font-black text-white group-hover/card:text-[#A29BFE] transition-colors">{rec.candidate?.name || '未知人才'}</div>
                                <div className="text-[9px] text-[#555762] mt-1 uppercase font-black tracking-widest flex items-center gap-1.5">
                                  <Briefcase size={10} className="text-[#6C5CE7]" /> {rec.jobPosition?.title || '未关联职位'}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[14px] font-black text-transparent bg-clip-text bg-gradient-to-b from-[#6C5CE7] to-[#00D2FF] tracking-tighter">
                                {Math.round(rec.matchScore || 85)}%
                              </div>
                              <div className="text-[8px] text-[#555762] uppercase font-black tracking-widest">Match</div>
                            </div>
                          </div>

                          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-5 group-hover/card:bg-white/[0.04] transition-colors">
                             <p className="text-[10px] text-[#8B8D97] leading-relaxed m-0 italic font-medium line-clamp-2">
                               {rec.candidate?.latestReview || "核心技术栈高度契合，具有分布式架构经验，契合该节点 T12 专家级要求。"}
                             </p>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex gap-4">
                              <Tooltip title="AI 邀约建议"><Send size={14} className="text-[#555762] hover:text-[#00D2FF] transition-colors" /></Tooltip>
                              <Tooltip title="同步至客户节点"><Share2 size={14} className="text-[#555762] hover:text-[#00E676] transition-colors" /></Tooltip>
                            </div>
                            <div className="flex items-center gap-3">
                               <button className="bg-[#6C5CE7]/10 text-[#6C5CE7] hover:bg-[#6C5CE7] hover:text-white px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-[#6C5CE7]/20">
                                 AI Report
                               </button>
                               <div className="w-1.5 h-1.5 rounded-full bg-white/5 group-hover/card:bg-[#6C5CE7] transition-all" />
                            </div>
                          </div>
                        </SpotlightCard>
                      </motion.div>
                    ))}
                </AnimatePresence>
              )}
              
              {!loading && filteredData.filter(r => r.status === statusKey).length === 0 && (
                <div className="h-40 border-2 border-dashed border-white/[0.03] rounded-3xl flex flex-col items-center justify-center opacity-20 hover:opacity-40 transition-opacity">
                   <Zap size={24} className="mb-2" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-center">暂无节点<br/>流入该流程</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <CandidateDetailDrawer
        visible={isDrawerOpen}
        candidate={selectedCandidate}
        onClose={() => setIsDrawerOpen(false)}
      />
    </motion.div>
  );
}
