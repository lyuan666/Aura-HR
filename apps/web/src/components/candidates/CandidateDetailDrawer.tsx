'use client';

import React, { useState } from 'react';
import { Drawer, Tabs, Button, Space, Typography, Tag, Avatar, Divider, Steps, Input, Badge, Tooltip } from 'antd';
import { 
  FileTextOutlined, 
  PaperClipOutlined, 
  HistoryOutlined, 
  ShareAltOutlined,
  DownloadOutlined,
  MoreOutlined,
  StarOutlined,
  PhoneOutlined,
  MailOutlined,
  SendOutlined,
  CloseOutlined,
  EditOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import StandardResumeContent from './StandardResumeContent';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const { Title, Text, Paragraph } = Typography;

interface CandidateDetailDrawerProps {
  visible: boolean;
  candidate: any;
  onClose: () => void;
}

const CandidateDetailDrawer: React.FC<CandidateDetailDrawerProps> = ({ visible, candidate, onClose }) => {
  const [activeTab, setActiveTab] = useState('standard');

  if (!candidate) return null;

  const tabItems = [
    {
      key: 'standard',
      label: (
        <Space size={4}>
          <FileTextOutlined />
          标准解析
        </Space>
      ),
      children: <StandardResumeContent candidate={candidate} />,
    },
    {
      key: 'attachment',
      label: (
        <Space size={4}>
          <PaperClipOutlined />
          附件原件
        </Space>
      ),
      children: (
        <div className="flex flex-col items-center justify-center p-20 bg-white/5 rounded-3xl border-2 border-dashed border-border-subtle m-8">
           <PaperClipOutlined className="text-5xl text-text-sub/40 mb-6" />
           <p className="text-text-sub text-sm mb-6 font-bold uppercase tracking-widest text-center">暂未检测到原始 PDF 附件<br/>解析节点已存储为结构化 Json数据</p>
           <Button type="primary" size="large" className="rounded-xl px-10 h-11 bg-white/5 border-border-subtle text-text-main/80 font-black uppercase tracking-widest hover:bg-white/10 transition-all">立即关联附件</Button>
        </div>
      ),
    },
    {
      key: 'records',
      label: (
        <Space size={4}>
          <HistoryOutlined />
          交付矩阵
        </Space>
      ),
      children: (
        <div className="p-8">
          <Steps
            direction="vertical"
            size="small"
            current={1}
            className="v2-steps-dark"
            items={[
              {
                title: <span className="text-xs font-black text-text-main/90">通过系统初筛</span>,
                description: <span className="text-[10px] text-text-sub font-bold">由 AI 引擎自动完成评估</span>,
                subTitle: <span className="text-[9px] text-text-sub/60">2023-11-20 14:30</span>,
              },
              {
                title: <span className="text-xs font-black text-brand-light">推荐至：字节跳动 - 架构专家</span>,
                description: <span className="text-[10px] text-text-sub font-bold">当前状态：客户评估中</span>,
                subTitle: <span className="text-[9px] text-text-sub/60">2023-11-21 10:00</span>,
              },
              {
                title: <span className="text-xs font-black text-text-sub/40">面试环节</span>,
                description: <span className="text-[10px] text-text-sub/30 font-bold">待安排技术面时间</span>,
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <Drawer
      open={visible}
      onClose={onClose}
      width={1100}
      styles={{
        header: { display: 'none' },
        body: { padding: 0, overflow: 'hidden' },
        content: { backgroundColor: 'var(--bg-base)', borderLeft: '1px solid var(--border-color)' }
      }}
      className="candidate-drawer-v2"
      closeIcon={null}
    >
      <div className="flex h-full text-white/80">
        {/* 左侧：简历主体内容 */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col border-r border-border-subtle">
          {/* 悬浮页眉块 - Glassmorphism */}
          <div className="sticky top-0 z-20 bg-bg-base/80 backdrop-blur-xl px-10 py-8 border-b border-border-subtle flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <Avatar src={candidate.avatar} size={72} className="border-4 border-white/5 shadow-2xl shadow-black ring-2 ring-brand-primary/20" />
              <div>
                <div className="flex items-center mb-1">
                  <h2 className="text-2xl font-black text-text-main m-0 mr-4 tracking-tight">{candidate.name || '未知候选人'}</h2>
                  <Tag className="m-0 border-none bg-brand-primary/10 text-brand-light font-black text-[9px] uppercase px-2 py-0.5 rounded-md">
                    Elite Talent
                  </Tag>
                </div>
                <div className="flex items-center space-x-4 text-text-sub/60 text-[11px] font-black uppercase tracking-widest mt-2">
                  <span className="text-text-sub">{candidate.gender || '保密'}</span>
                  <span className="w-1 h-1 rounded-full bg-text-sub/20" />
                  <span className="text-text-sub">{candidate.education || '本科'}</span>
                  <span className="w-1 h-1 rounded-full bg-text-sub/20" />
                  <span className="text-text-sub">{candidate.experienceYears || 0} Years Exp</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
               <button className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/5 transition-all text-[#8B8D97] hover:text-white">
                 <ShareAltOutlined />
               </button>
               <button className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/5 transition-all text-[#8B8D97] hover:text-white">
                 <DownloadOutlined />
               </button>
               <button 
                 onClick={onClose}
                 className="bg-[#FF5252]/10 hover:bg-[#FF5252] p-2.5 rounded-xl border border-[#FF5252]/20 transition-all text-[#FF5252] hover:text-white ml-4"
                >
                 <CloseOutlined />
               </button>
            </div>
          </div>

          {/* 简历内容区域 */}
          <div className="flex-1 flex flex-col">
            <div className="px-10 py-1 border-b border-border-subtle flex space-x-10 bg-white/[0.01]">
              {tabItems.map(item => (
                <div 
                  key={item.key} 
                  onClick={() => setActiveTab(item.key)}
                  className={cn(
                    "py-4 px-1 text-[11px] font-black uppercase tracking-[0.2em] cursor-pointer transition-all border-b-2",
                    activeTab === item.key ? "text-brand-primary border-brand-primary" : "text-text-sub/40 border-transparent hover:text-text-main/60"
                  )}
                >
                  {item.label}
                </div>
              ))}
            </div>
            <div className="flex-1 p-0 overflow-y-auto no-scrollbar">
               <AnimatePresence mode="wait">
                 <motion.div
                   key={activeTab}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                 >
                   {tabItems.find(t => t.key === activeTab)?.children}
                 </motion.div>
               </AnimatePresence>
            </div>
          </div>
        </div>

        {/* 右侧：跟进信息与流程控制 - Sci-fi Panel */}
        <div className="w-[380px] bg-bg-surface overflow-y-auto no-scrollbar flex flex-col pt-10">
          <div className="px-8 mb-10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[11px] font-black text-text-sub/60 m-0 uppercase tracking-[0.3em]">Lifecycle Console</h3>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_var(--color-success)]" />
                 <span className="text-[10px] font-black text-success uppercase">In Pipeline</span>
              </div>
            </div>
            
            {/* AI 评估卡片 - Glowing */}
            <div className="bg-gradient-to-br from-brand-primary to-brand-dark rounded-3xl p-6 mb-10 shadow-2xl shadow-brand-primary/20 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-all" />
               <ThunderboltOutlined className="absolute right-[-10px] bottom-[-10px] text-7xl text-white/5 rotate-12" />
               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <ThunderboltOutlined className="text-white/80 animate-pulse text-xs" />
                    <span className="text-white/60 text-[9px] uppercase font-black tracking-widest">AI Matching Analysis</span>
                  </div>
                  <div className="text-4xl font-black text-white mb-3 tracking-tighter italic">92<span className="text-sm font-normal ml-1 opacity-50">/100</span></div>
                  <p className="text-white/70 text-[11px] mb-6 leading-relaxed font-bold">
                    核心技术栈匹配度极高。候选人在 <span className="text-white border-b border-white/30">分布式架构</span> 与 <span className="text-white border-b border-white/30">高并发处理</span> 领域有深厚积淀，契合 T12 专家级标准。
                  </p>
                  <button className="w-full bg-white/20 hover:bg-white/30 text-white text-[10px] font-black uppercase tracking-[0.15em] py-3 rounded-xl transition-all border border-white/10 active:scale-95">
                    查看完整 AI 匹配报告
                  </button>
               </div>
            </div>

            {/* 流程进度 */}
            <div className="bg-white/[0.02] rounded-3xl p-6 border border-border-subtle mb-8">
              <div className="text-[10px] font-black text-text-sub/40 uppercase tracking-widest mb-6 flex justify-between items-center group cursor-pointer">
                <span>Workflow Nodes</span>
                <EditOutlined className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <Steps
                direction="vertical"
                current={1}
                size="small"
                className="v2-steps-dark"
                items={[
                  { title: <span className="text-[11px] font-black text-text-main/60">初筛通过</span>, status: 'finish' },
                  { title: <span className="text-[11px] font-black text-text-main">推荐至客户方</span>, status: 'process' },
                  { title: <span className="text-[11px] font-black text-text-sub/40">技术首面</span>, status: 'wait' },
                  { title: <span className="text-[11px] font-black text-text-sub/40">终面试用</span>, status: 'wait' },
                ]}
              />
            </div>

            {/* 联系方式快捷栏 */}
            <div className="grid grid-cols-2 gap-3 mb-8">
               <button className="flex items-center justify-center gap-2 bg-bg-elevated border border-border-subtle py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-sub hover:text-white hover:border-brand-primary/30 transition-all">
                 <PhoneOutlined size={12} /> Call
               </button>
               <button className="flex items-center justify-center gap-2 bg-bg-elevated border border-border-subtle py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-sub hover:text-white hover:border-brand-primary/30 transition-all">
                 <MailOutlined size={12} /> Email
               </button>
            </div>

            {/* 跟进记录 */}
            <div className="bg-white/[0.02] rounded-3xl p-6 border border-border-subtle">
               <div className="text-[10px] font-black text-text-sub/60 uppercase tracking-widest mb-4 flex items-center">
                 <SafetyCertificateOutlined className="mr-2 text-brand-primary" /> Internal Note
               </div>
               <Input.TextArea 
                  placeholder="在此输入跟进纪要或反馈..." 
                  rows={4} 
                  className="!bg-bg-elevated !border-border-subtle !rounded-2xl !text-[11px] !text-text-main/80 placeholder:!text-text-sub/30 focus:!border-brand-primary/40 !p-4 mb-4"
               />
               <div className="flex justify-between items-center">
                 <span className="text-[9px] font-black text-text-sub/40 uppercase tracking-widest">Auto-saving...</span>
                 <button className="bg-brand-primary hover:bg-brand-dark text-white p-2.5 rounded-xl transition-all shadow-lg shadow-brand-primary/20 active:scale-90">
                   <SendOutlined />
                 </button>
               </div>
            </div>
          </div>

          <div className="mt-auto p-8 border-t border-border-subtle bg-bg-surface/50 backdrop-blur-xl">
             <button className="w-full h-12 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-light text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all mb-4">
               推进到下一流程阶段
             </button>
             <div className="grid grid-cols-2 gap-3">
               <button className="h-11 rounded-2xl bg-white/5 border border-border-subtle text-[10px] font-black uppercase tracking-widest text-error hover:bg-error/10 transition-all">淘汰此节点</button>
               <button className="h-11 rounded-2xl bg-white/5 border border-border-subtle text-[10px] font-black uppercase tracking-widest text-text-sub hover:bg-white/10 transition-all">移入公海池</button>
             </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default CandidateDetailDrawer;
