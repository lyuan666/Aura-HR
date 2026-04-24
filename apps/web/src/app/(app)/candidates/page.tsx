'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, ChevronDown, Mail, Star, Settings2, Eraser, Briefcase, GraduationCap } from 'lucide-react';
import api from '@/lib/api';
import CandidateDetailModal from '@/components/candidates/CandidateDetailModal';
import ResumeUploadModal from '@/components/candidates/ResumeUploadModal';
import { App, Skeleton, Empty, Tag, Checkbox } from 'antd';
import { cn } from '@/lib/utils';

export default function CandidatesPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/candidates');
      setCandidates(res.data?.items || []);
    } catch (e) {
      console.error(e);
      message.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => 
      !searchQuery || [c.name, c.currentTitle, c.currentCompany].some(f => f?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [candidates, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0B0D11] text-[#F0F0F2] p-8">
      
      {/* 1. Header Area */}
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <h1 className="text-xl font-black text-white tracking-wide">全部简历</h1>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="h-[34px] px-5 rounded bg-transparent border border-[#6C5CE7] text-[#A29BFE] text-[13px] font-bold hover:bg-[#6C5CE7]/10 transition-all"
          >
            上传简历
          </button>
          <button className="h-[34px] px-5 rounded bg-transparent border border-[#6C5CE7] text-[#A29BFE] text-[13px] font-bold hover:bg-[#6C5CE7]/10 transition-all flex items-center gap-2">
            邮箱归集
          </button>
          <button className="h-[34px] w-[34px] flex items-center justify-center rounded bg-transparent border border-[#6C5CE7] text-[#A29BFE] hover:bg-[#6C5CE7]/10 transition-all">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex flex-wrap gap-2">
          <div className="h-8 pl-3 pr-2 rounded bg-[#1A1D25] border border-white/5 flex items-center gap-2 group cursor-pointer hover:bg-white/5">
            <span className="text-[12px] text-white/50">标签</span>
            <span className="text-[12px] text-white/30 hover:text-white/80">✕</span>
          </div>
          <div className="h-8 pl-3 pr-2 rounded bg-[#1A1D25] border border-white/5 flex items-center gap-2 group cursor-pointer hover:bg-white/5">
            <span className="text-[12px] text-white/50 flex items-center gap-1">上传方式 <ChevronDown size={12} /></span>
            <span className="text-[12px] text-white/30 hover:text-white/80">✕</span>
          </div>
          <div className="h-8 pl-3 pr-2 rounded bg-[#1A1D25] border border-white/5 flex items-center gap-2 group cursor-pointer hover:bg-white/5">
            <span className="text-[12px] text-white/50">当前职位</span>
            <span className="text-[12px] text-white/30 hover:text-white/80">✕</span>
          </div>
          <div className="h-8 pl-3 pr-2 rounded bg-[#1A1D25] border border-white/5 flex items-center gap-2 group cursor-pointer hover:bg-white/5">
            <span className="text-[12px] text-white/50 flex items-center gap-1">当前流程 <ChevronDown size={12} /></span>
            <span className="text-[12px] text-white/30 hover:text-white/80">✕</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
           <button className="flex items-center gap-1.5 text-[12px] text-white/50 hover:text-white transition-colors">
              <Settings2 size={14} /> 筛选设置
           </button>
           <button className="flex items-center gap-1.5 text-[12px] text-white/50 hover:text-white transition-colors">
              <Eraser size={14} /> 清空
           </button>
        </div>
      </div>

      {/* 3. Bulk Action Bar */}
      <div className="flex items-center justify-between py-3 flex-shrink-0 border-b border-white/5 mb-2">
        <div className="flex items-center gap-4">
          <Checkbox className="v2-dark-checkbox" />
          <span className="text-[12px] text-white/50 ml-1">共 <span className="text-[#00D2FF] font-bold mx-1">{filteredCandidates.length}</span> 名</span>
          
          <div className="flex items-center gap-3 ml-2">
            <button className="flex items-center gap-1 text-[12px] text-white/60 hover:text-white transition-colors bg-transparent px-3 py-1.5 rounded border border-white/10 hover:border-white/30">
              简历管理 <ChevronDown size={12} />
            </button>
            <button className="text-[12px] text-white/60 hover:text-white transition-colors bg-transparent px-3 py-1.5 rounded border border-white/10 hover:border-white/30">
              加入职位
            </button>
            <button className="text-[12px] text-white/60 hover:text-white transition-colors bg-transparent px-3 py-1.5 rounded border border-white/10 hover:border-white/30">
              分享
            </button>
            <button className="flex items-center gap-1 text-[12px] text-white/60 hover:text-white transition-colors bg-transparent px-3 py-1.5 rounded border border-white/10 hover:border-white/30">
              导出 <ChevronDown size={12} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[12px] text-white/50 cursor-pointer hover:text-white">
           <ChevronDown size={14} /> 默认综合排序
        </div>
      </div>

      {/* 4. List Area - 1:1 Structure */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
        <div className="flex flex-col">
          {loading ? (
             [1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-white/5 rounded animate-pulse my-2" />)
          ) : filteredCandidates.map((c, i) => (
            <motion.div
              key={c.id || i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => { setSelectedCandidate(c); setIsModalOpen(true); }}
              className="group flex items-start py-6 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer"
            >
              {/* Left Column: Identity */}
              <div className="flex items-start w-[320px] flex-shrink-0 pl-1 relative">
                <Checkbox className="v2-dark-checkbox mt-2" onClick={(e) => e.stopPropagation()} />
                <div className="ml-4 flex gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1A1D25] to-[#2A2D35] border border-white/10 flex items-center justify-center text-sm font-bold text-white shadow-lg overflow-hidden">
                      {c.avatar ? <img src={c.avatar} alt="" className="w-full h-full object-cover" /> : (c.name?.[0] || '?')}
                    </div>
                    {/* Gender icon (Red for female, blue for male logic based on screenshot) */}
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] rounded-full flex items-center justify-center text-[8px] text-white border-2 border-[#0B0D11]",
                      c.gender === 'female' ? "bg-[#FF6B9D]" : "bg-[#6C5CE7]"
                    )}>
                      {c.gender === 'female' ? '♀' : '♂'}
                    </div>
                  </div>
                  <div className="min-w-0 pr-8 relative">
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                      <span className="text-[14px] font-bold text-white/90">{c.name || '未知姓名'}</span>
                      <span className="text-[12px] text-white/40 font-medium">
                        {c.age || 35}岁 <span className="mx-0.5 text-white/20">|</span> {c.degree || '大专'} <span className="mx-0.5 text-white/20">|</span> {c.totalYears || 13}年
                      </span>
                    </div>
                    <div className="mt-2.5">
                      <Tag className="m-0 bg-white/[0.03] border-none text-white/50 text-[11px] px-2 py-0.5 rounded shadow-sm">
                        {c.status === 'new' ? '稳定性高' : '暂无标签'}
                      </Tag>
                    </div>
                    {/* Star Icon - positioned absolute to match image layout */}
                    <div className="absolute right-0 top-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Star size={14} className="text-white/30 hover:text-[#FFD700] transition-colors" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Column: Timeline */}
              <div className="flex-1 px-4 relative flex flex-col gap-3 pb-1">
                {/* Timeline vertical dotted line connecting icons */}
                <div className="absolute left-[23px] top-[18px] bottom-4 w-[1px] border-l border-dotted border-white/20" />

                {/* Experience Item 1 */}
                <div className="flex items-start relative z-10 group/row">
                  <div className="flex items-start gap-3 w-full">
                    <div className="bg-[#0B0D11] pt-0.5"><Briefcase size={14} className="text-white/40" /></div>
                    <div className="min-w-0 pt-[1px] flex flex-col">
                      <div className="text-[13px] text-white/80 font-medium flex items-center gap-3">
                        <span className="text-[12px] text-white/40 tabular-nums w-[120px] shrink-0 whitespace-nowrap">{c.currentCompany ? '2024.10-至今' : '2024.10-至今'}</span>
                        <div className="flex items-center">
                          <span className="text-[#6C5CE7] hover:underline cursor-pointer border-b border-dashed border-[#6C5CE7]/30 pb-[1px]">
                            {c.currentCompany || '阿里云'}
                          </span>
                          <span className="mx-1 text-white/30">-</span>
                          <span>{c.currentTitle || '前端开发专家'}</span>
                        </div>
                      </div>
                      {/* Sub-experience if any (like in the second row of the screenshot) */}
                      <div className="text-[12px] text-white/40 mt-1.5 flex items-center gap-3">
                         <span className="tabular-nums opacity-60 w-[120px] shrink-0 whitespace-nowrap">2023.02-2024.09</span>
                         <div className="flex items-center">
                           <span className="text-[#6C5CE7]/80 hover:underline cursor-pointer border-b border-dashed border-[#6C5CE7]/20 pb-[1px]">杭州必定特供应链有限公司</span>
                           <span className="mx-1 text-white/20">-</span>
                           <span>成本会计</span>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Education Item */}
                <div className="flex items-start relative z-10 mt-1">
                  <div className="flex items-start gap-3 w-full">
                    <div className="bg-[#0B0D11] pt-0.5"><GraduationCap size={14} className="text-white/40" /></div>
                    <div className="min-w-0 pt-[1px] flex items-center gap-3 text-[13px] text-white/60">
                      <span className="text-[12px] text-white/40 tabular-nums w-[120px] shrink-0 whitespace-nowrap">2008.01-2012.01</span>
                      <div className="flex items-center">
                        <span className="hover:underline cursor-pointer border-b border-dashed border-white/20 pb-[1px]">{c.school || '浙江大学'}</span>
                        <span className="mx-1 text-white/30">-</span>
                        <span>{c.degree || '硕士'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Actions */}
              <div className="w-[180px] flex items-start justify-end gap-2 flex-shrink-0 pr-4 mt-0.5">
                <button className="h-[28px] px-3 rounded bg-[#6C5CE7]/10 text-[#A29BFE] text-[12px] font-medium hover:bg-[#6C5CE7]/20 transition-colors">
                  加入分组
                </button>
                <button className="h-[28px] px-3 rounded bg-[#6C5CE7]/10 text-[#A29BFE] text-[12px] font-medium hover:bg-[#6C5CE7]/20 transition-colors">
                  备注
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {!loading && filteredCandidates.length === 0 && (
          <div className="py-32 flex flex-col items-center justify-center">
             <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className="text-white/30 text-[12px]">暂无数据</span>} />
          </div>
        )}
      </div>

      <CandidateDetailModal
        visible={isModalOpen}
        candidate={selectedCandidate}
        onClose={() => setIsModalOpen(false)}
      />
      <ResumeUploadModal
        visible={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={fetchCandidates}
      />
    </div>
  );
}
