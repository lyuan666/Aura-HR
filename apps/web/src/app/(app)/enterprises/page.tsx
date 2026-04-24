'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Building2, Globe, Users, Briefcase, ExternalLink, ShieldCheck, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import { SpotlightCard } from '@/components/v2/SpotlightCard';
import { App, Skeleton, Empty, Tooltip, Tag } from 'antd';

export default function EnterprisesPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEnterprises = async () => {
    try {
      setLoading(true);
      const res = await api.get('/enterprises');
      setEnterprises(res.data?.items || []);
    } catch (e) {
      console.error(e);
      message.error('客户节点同步失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnterprises();
  }, []);

  const filteredEnterprises = useMemo(() => {
    return enterprises.filter(ent => 
      !searchQuery || ent.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [enterprises, searchQuery]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col h-full overflow-hidden pb-8">
      {/* Header Area */}
      <div className="flex items-end justify-between mb-8 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">客户矩阵 <span className="text-sm font-normal text-[#555762] ml-2">Client Matrix</span></h1>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00D2FF] shadow-[0_0_8px_#00D2FF]" />
            <span className="text-[11px] text-[#8B8D97] font-bold uppercase tracking-widest">
              正在服务中的全球企业客户共 {enterprises.length} 家
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="bg-white/5 border border-white/10 hover:bg-white/10 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest text-white/80 transition-all flex items-center gap-2">
            <TrendingUp size={14} /> 市场洞察
          </button>
          <button className="bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] text-white px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-[#6C5CE7]/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
            <Plus size={14} /> 新增合作节点
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-4 mb-8 flex-shrink-0">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555762] group-focus-within:text-[#6C5CE7] transition-colors" size={16} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索企业名称、行业或客户经理..." 
            className="w-full bg-[#13161C] border border-white/5 group-hover:border-white/10 focus:border-[#6C5CE7]/50 rounded-xl py-3.5 pl-12 pr-4 text-xs outline-none text-white transition-all placeholder:text-[#555762]" 
          />
        </div>
        <div className="flex gap-2">
           <select className="bg-[#13161C] border border-white/5 rounded-xl px-5 py-2 text-[11px] font-black text-[#8B8D97] uppercase outline-none focus:border-[#6C5CE7]/50 cursor-pointer hover:bg-[#1A1D25] transition-all">
            <option>行业分类 (不限)</option>
            <option>互联网/科技</option>
            <option>金融/保险</option>
            <option>智能制造</option>
          </select>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar pr-2">
        <div className="grid grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3, 4, 5, 6].map(i => (
              <SpotlightCard key={i} className="p-8 h-[300px]">
                <Skeleton active avatar paragraph={{ rows: 4 }} />
              </SpotlightCard>
            ))
          ) : filteredEnterprises.map((ent, i) => (
            <motion.div 
              key={ent.id || i} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.05 }}
            >
              <SpotlightCard className="h-full flex flex-col p-8 group hover:border-[#6C5CE7]/30 transition-all border border-white/5">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1A1D25] to-[#2A2D35] border border-white/10 flex items-center justify-center text-2xl font-black text-white group-hover:scale-105 transition-transform shadow-2xl">
                    {ent.name?.[0] || 'E'}
                  </div>
                  <Tag className="m-0 border-none bg-[#00E676]/10 text-[#00E676] font-black text-[9px] uppercase px-3 py-1 rounded-lg">
                    Partnership
                  </Tag>
                </div>

                <h3 className="text-xl font-black text-white mb-2 group-hover:text-[#A29BFE] transition-colors">{ent.name || '未命名企业'}</h3>
                <div className="flex items-center gap-4 text-[#555762] text-[10px] font-black uppercase tracking-widest mb-6">
                  <span className="flex items-center gap-1.5"><Globe size={12} /> {ent.industry || '未知行业'}</span>
                  <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-[#6C5CE7]" /> 深度合作</span>
                </div>

                <p className="text-[11px] text-[#8B8D97] mb-8 line-clamp-2 leading-relaxed font-medium">
                  {ent.description || '该企业正在通过天选 OS 数字化招聘链路进行人才库资产构建与深度寻猎。'}
                </p>

                <div className="grid grid-cols-2 gap-4 mt-auto">
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 group-hover:bg-white/[0.04] transition-colors">
                    <div className="text-[9px] font-black text-[#555762] uppercase tracking-widest mb-1">活跃招聘需求</div>
                    <div className="text-lg font-black text-white flex items-center gap-2">
                      <Briefcase size={14} className="text-[#6C5CE7]" /> 8 <span className="text-[10px] font-normal text-[#555762] opacity-50">Nodes</span>
                    </div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 group-hover:bg-white/[0.04] transition-colors">
                    <div className="text-[9px] font-black text-[#555762] uppercase tracking-widest mb-1">待面试候选人</div>
                    <div className="text-lg font-black text-white flex items-center gap-2">
                      <Users size={14} className="text-[#00D2FF]" /> 24 <span className="text-[10px] font-normal text-[#555762] opacity-50">Candidates</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(j => (
                      <div key={j} className="w-6 h-6 rounded-full bg-[#1A1D25] border border-white/10 flex items-center justify-center text-[8px] font-black">
                        {j}
                      </div>
                    ))}
                    <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[8px] font-black text-[#555762]">
                      +2
                    </div>
                  </div>
                  <button className="text-[10px] font-black text-[#6C5CE7] uppercase tracking-[0.15em] hover:text-white transition-all flex items-center gap-1.5 group/btn">
                    详情工作流 <ExternalLink size={12} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </button>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>

        {!loading && filteredEnterprises.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40">
            <Empty 
              image={Empty.PRESENTED_IMAGE_SIMPLE} 
              description={<span className="text-[11px] font-black uppercase tracking-widest text-[#555762]">未发现符合条件的客户节点</span>} 
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
