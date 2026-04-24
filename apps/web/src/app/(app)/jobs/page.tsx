'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Filter, Briefcase, DollarSign, Target, Zap, TrendingUp, MoreHorizontal, MapPin } from 'lucide-react';
import api from '@/lib/api';
import { SpotlightCard } from '@/components/v2/SpotlightCard';
import SmartJobCreationModal from '@/components/jobs/SmartJobCreationModal';
import { App, Skeleton, Empty, Tag, Tooltip, Progress } from 'antd';
import { useRouter } from 'next/navigation';

export default function JobsPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/job-positions');
      setJobs(res.data?.items || []);
    } catch (e) {
      console.error(e);
      message.error('职位图谱同步失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => 
      !searchQuery || [job.title, job.enterprise?.name].some(f => f?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [jobs, searchQuery]);

  const stats = useMemo(() => {
    const active = Array.isArray(jobs) ? jobs.filter(j => j.status === 'active').length : 0;
    const closed = Array.isArray(jobs) ? jobs.filter(j => j.status === 'closed').length : 0;
    return [
      { label: '招募中需求', value: active, color: '#00E676', icon: <Target size={14} /> },
      { label: '已关闭节点', value: closed, color: '#FF5252', icon: <Briefcase size={14} /> },
      { label: '待处理面试', value: 24, color: '#00D2FF', icon: <TrendingUp size={14} /> },
      { label: 'AI 平均匹配', value: '88%', color: '#6C5CE7', icon: <Zap size={14} /> },
    ];
  }, [jobs]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col h-full overflow-hidden pb-4">
      {/* Header Area */}
      <div className="flex items-end justify-between mb-8 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">职位图谱 <span className="text-sm font-normal text-[#555762] ml-2">Job Matrix</span></h1>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#6C5CE7] shadow-[0_0_8px_#6C5CE7]" />
            <span className="text-[11px] text-[#8B8D97] font-bold uppercase tracking-widest">
              实时索引 {jobs.length} 个全球高精尖招聘节点
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsModalVisible(true)}
            className="bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] text-white px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-[#6C5CE7]/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={14} /> 开启新招聘节点
          </button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8 shrink-0">
        {stats.map((stat, i) => (
          <SpotlightCard key={i} className="p-6 flex flex-col border border-white/5 group hover:border-white/10 transition-all">
            <div className="flex items-center gap-2 mb-2">
               <span style={{ color: stat.color }} className="opacity-80">{stat.icon}</span>
               <span className="text-[9px] font-black text-[#555762] uppercase tracking-[0.2em]">{stat.label}</span>
            </div>
            <div className="text-3xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform origin-left">{stat.value}</div>
          </SpotlightCard>
        ))}
      </div>

      <SpotlightCard className="flex-1 flex flex-col overflow-hidden border border-white/5">
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#11131A]/80 backdrop-blur-xl sticky top-0 z-20">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555762] group-focus-within:text-[#6C5CE7] transition-colors" size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索职位名称、核心技能或所属企业..." 
              className="w-full bg-[#13161C] border border-white/5 rounded-xl py-2.5 pl-12 pr-4 text-[11px] focus:border-[#6C5CE7]/50 focus:outline-none text-white transition-all placeholder:text-[#555762]" 
            />
          </div>
          <div className="flex gap-2">
            <button className="bg-white/5 border border-white/5 p-2.5 rounded-xl text-[#555762] hover:text-white hover:bg-white/10 transition-all"><Filter size={16} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-auto no-scrollbar relative">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#11131A]/50 text-[#555762] text-[10px] font-black uppercase tracking-[0.2em] sticky top-0 z-10 border-b border-white/5">
              <tr>
                <th className="p-5">职位详情 / 所属机构</th>
                <th className="p-5">薪酬体系 / 地点</th>
                <th className="p-5">AI 技能图谱</th>
                <th className="p-5">节点流转进度</th>
                <th className="p-5 text-right">操作控制台</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i}><td colSpan={5} className="p-5"><Skeleton active paragraph={{ rows: 1 }} /></td></tr>
                ))
              ) : filteredJobs.map((job, i) => (
                <motion.tr 
                  key={job.id || i} 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.02 }}
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  className="hover:bg-white/[0.03] cursor-pointer transition-all group"
                >
                  <td className="p-5">
                    <div className="font-black text-white/90 text-sm group-hover:text-[#A29BFE] transition-colors mb-1">{job.title || '未命名职位'}</div>
                    <div className="text-[10px] text-[#555762] font-bold flex items-center gap-1.5 uppercase tracking-widest">
                      <Target size={12} className="text-[#6C5CE7]" /> {job.enterprise?.name || '核心客户节点'}
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF9100] to-[#FFAB40] tracking-tight">{job.salaryMin}K - {job.salaryMax}K</div>
                    <div className="text-[10px] text-[#555762] font-bold flex items-center gap-1.5 mt-1 uppercase">
                      <MapPin size={10} /> {job.location || '北京'}
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                      {(job.skillTags || ['Java', 'Spring', 'Redis']).slice(0, 3).map((tag: string) => (
                        <Tag key={tag} className="m-0 border-none bg-white/5 text-[9px] font-black uppercase text-[#8B8D97] px-2 py-0.5 rounded-md">
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-2 w-32">
                       <div className="flex justify-between items-center text-[9px] font-black text-[#555762] uppercase tracking-widest">
                         <span>Pipeline</span>
                         <span>{job.candidateCount || 0}/10</span>
                       </div>
                       <Progress 
                        percent={Math.min((job.candidateCount || 0) * 10, 100)} 
                        showInfo={false} 
                        size="small" 
                        strokeColor={{ '0%': '#6C5CE7', '100%': '#00D2FF' }}
                        trailColor="rgba(255,255,255,0.02)"
                        strokeWidth={4}
                      />
                    </div>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex items-center justify-end gap-4">
                       <button 
                        onClick={(e) => { e.stopPropagation(); router.push(`/jobs/${job.id}/matches`); }}
                        className="bg-[#6C5CE7]/10 text-[#6C5CE7] hover:bg-[#6C5CE7] hover:text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 border border-[#6C5CE7]/20"
                       >
                         <Zap size={12} className="fill-current" /> AI Match
                       </button>
                       <button className="text-[#555762] hover:text-white p-2 transition-colors"><MoreHorizontal size={18} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {!loading && filteredJobs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-40">
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className="text-[10px] font-black text-[#555762] uppercase tracking-widest">暂未发现活跃招聘节点</span>} />
            </div>
          )}
        </div>
      </SpotlightCard>

      <SmartJobCreationModal
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onSuccess={() => {
          setIsModalVisible(false);
          fetchJobs();
        }}
      />
    </motion.div>
  );
}
