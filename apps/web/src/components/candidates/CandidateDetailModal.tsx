'use client';

import React, { useState } from 'react';
import { Modal, Tabs, Space, Tag, Avatar, Input, Button, Tooltip } from 'antd';
import {
  CloseOutlined,
  StarOutlined,
  MoreOutlined,
  PlusOutlined,
  SendOutlined,
  ThunderboltOutlined,
  DownOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  HistoryOutlined,
  MessageOutlined,
  CalendarOutlined,
  FolderOpenOutlined
} from '@ant-design/icons';
import StandardResumeContent from './StandardResumeContent';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CandidateDetailModalProps {
  visible: boolean;
  candidate: any;
  onClose: () => void;
}

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: '新简历', color: '#00D2D3', bg: 'bg-success/10' },
  screening: { label: '初筛中', color: '#A29BFE', bg: 'bg-brand-light/10' },
  interview: { label: '面试中', color: '#6C5CE7', bg: 'bg-brand-primary/10' },
  offer: { label: 'Offer', color: '#FF9F43', bg: 'bg-warning/10' },
  rejected: { label: '已淘汰', color: '#FF4D4F', bg: 'bg-error/10' },
  hired: { label: '已入职', color: '#00D2D3', bg: 'bg-success/10' },
};

function formatTimeAgo(dateStr: string) {
  if (!dateStr) return '--';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  const months = Math.floor(days / 30);
  return `${months}个月前`;
}

const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({ visible, candidate, onClose }) => {
  const [activeTab, setActiveTab] = useState('standard');

  if (!candidate) return null;

  const status = statusMap[candidate.status] || statusMap.new;
  const skills = candidate.parsedTags?.skills || [];

  const tabItems = [
    { key: 'attachment', label: '附件简历' },
    { key: 'standard', label: '标准简历' },
    { key: 'works', label: '作品附件' },
    { key: 'interview', label: '面试' },
    { key: 'delivery', label: '投递记录' },
    { key: 'operation', label: '操作日志' },
    { key: 'related', label: '关联人才' },
  ];

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width="90%"
      style={{ maxWidth: '1400px', top: '40px' }}
      centered
      closeIcon={null}
      className="candidate-detail-modal-v3"
      styles={{
        mask: {
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(0,0,0,0.8)'
        },
        body: {
          padding: 0,
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '12px',
          overflow: 'hidden',
          height: 'calc(100vh - 120px)',
          border: '1px solid var(--border-color)',
        }
      }}
    >
      <div className="flex flex-col h-full text-text-main">

        {/* 1. Window Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-surface">
          <div className="flex items-center gap-3">
            <span className="text-[16px] font-bold text-text-main">人才详情</span>
            <div className="flex items-center gap-1.5 text-[12px] text-text-sub/50">
              <span className="font-mono">ID: {candidate.id?.slice(0, 8) || '--'}</span>
              <span>·</span>
              <span>{formatTimeAgo(candidate.createdAt)}入库</span>
              <span>·</span>
              <span>简历上传</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-text-sub"
          >
            <CloseOutlined style={{ fontSize: '14px' }} />
          </button>
        </div>

        {/* Main Content Area: 75:25 Split */}
        <div className="flex-1 flex overflow-hidden">

          {/* Left Area (75%) */}
          <div className="w-3/4 flex flex-col border-r border-border-subtle overflow-y-auto no-scrollbar bg-bg-base">

            {/* 2. Personal Panorama Card */}
            <div className="px-10 pt-10 pb-6">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <Avatar
                      src={candidate.avatar}
                      size={80}
                      className="border border-border-subtle bg-bg-elevated"
                    >
                      {candidate.name?.[0] || '?'}
                    </Avatar>
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-bg-base border border-bg-base",
                      candidate.gender === 'female' ? "bg-error" : "bg-brand-primary"
                    )}>
                      {candidate.gender === 'female' ? '♀' : '♂'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[24px] font-bold text-text-main">{candidate.name || '未知'}</span>
                      <StarOutlined className="text-text-sub/30 hover:text-brand-primary cursor-pointer transition-colors text-lg" />
                    </div>

                    <div className="flex items-center gap-2 text-[13px] text-text-sub font-medium">
                      {candidate.age && <span>{candidate.age}岁</span>}
                      {candidate.age && candidate.degree && <span className="opacity-20">|</span>}
                      {candidate.degree && <span>{candidate.degree}</span>}
                      {candidate.totalYears ? <><span className="opacity-20">|</span><span>{candidate.totalYears}年经验</span></> : null}
                      {candidate.phone && (
                        <span className="ml-4 flex items-center gap-1.5 text-text-main/80">
                          <span className="w-4 h-4 rounded-full bg-bg-elevated flex items-center justify-center text-[10px]">📞</span>
                          {candidate.phone}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-1">
                      <Tag className="m-0 bg-brand-primary/10 border-none text-brand-primary text-[11px] px-2 py-0.5 rounded-sm">
                        {status.label}
                      </Tag>
                      {skills.slice(0, 2).map((s: string) => (
                        <Tag key={s} className="m-0 bg-white/5 border border-border-subtle text-text-sub/80 text-[11px] px-2 py-0.5 rounded-sm">
                          {s}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="h-9 px-4 rounded-md bg-white/5 border border-border-subtle text-text-main/80 text-[13px] font-medium hover:bg-white/10 transition-all flex items-center gap-2">
                    <PlusOutlined size={14} /> 添加待办
                  </button>
                  <button className="h-9 px-4 rounded bg-white/5 border border-white/10 text-white/80 text-[13px] font-bold hover:bg-white/10 transition-all">
                    加入分组
                  </button>
                  <button className="h-9 w-9 flex items-center justify-center rounded bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-all">
                    <MoreOutlined />
                  </button>
                </div>
              </div>

              {/* AI 折叠横幅 */}
              {candidate.notes && (
                <div className="mt-8 bg-bg-surface/50 border border-brand-primary/20 rounded-lg p-3 flex items-center justify-between cursor-pointer group hover:border-brand-primary/40 transition-all relative">
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-6 h-6 rounded bg-brand-primary/20 flex items-center justify-center text-[10px]">
                      <ThunderboltOutlined className="text-brand-primary" />
                    </div>
                    <span className="text-[13px] font-medium text-text-main/80">AI 解析摘要: {candidate.notes}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Tabs */}
            <div className="px-10 border-b border-border-subtle sticky top-0 bg-bg-base z-20">
              <div className="flex gap-8">
                {tabItems.map(tab => (
                  <div
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "py-4 text-[13px] font-bold cursor-pointer transition-all relative",
                      activeTab === tab.key ? "text-brand-primary" : "text-text-sub/60 hover:text-text-sub"
                    )}
                  >
                    {tab.label}
                    {activeTab === tab.key && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Content */}
            <div className="flex-1">
              <StandardResumeContent candidate={candidate} />
            </div>
          </div>

          {/* Right Sidebar (25%) */}
          <div className="w-1/4 bg-bg-surface p-6 flex flex-col gap-6">
            <Button
              type="primary"
              block
              size="large"
              className="h-12 bg-brand-primary hover:bg-brand-primary/80 border-none text-[14px] font-bold rounded-lg flex items-center justify-center gap-2"
            >
              加入职位 <DownOutlined />
            </Button>

            {/* 协同备注 */}
            <div className="bg-bg-elevated/30 border border-border-subtle rounded-lg p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[10px] font-bold text-text-sub/40 uppercase tracking-[0.2em] mb-1">
                <MessageOutlined /> 协同备注
              </div>
              <Input.TextArea
                placeholder="输入备注，支持@通知团队成员"
                rows={4}
                className="!bg-transparent !border-none !text-[13px] !text-text-main/80 placeholder:!text-white/10 !p-0 focus:!shadow-none resize-none no-scrollbar"
              />
              <div className="flex items-center justify-between mt-2 pt-3 border-t border-border-subtle">
                <button className="text-[12px] text-text-sub hover:text-white flex items-center gap-1 transition-colors">
                  选择模板 <DownOutlined style={{ fontSize: '10px' }} />
                </button>
                <button className="w-8 h-8 bg-brand-primary hover:bg-brand-dark text-white rounded-lg flex items-center justify-center transition-all active:scale-90 shadow-lg shadow-brand-primary/20">
                  <SendOutlined />
                </button>
              </div>
            </div>

            {/* 快捷信息栏 */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-text-sub/60">当前状态</span>
                <Tag className="m-0 border-none text-[11px] px-2 rounded" style={{ color: status.color, backgroundColor: `${status.color}15` }}>
                  {status.label}
                </Tag>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-text-sub/60">入库时间</span>
                <span className="text-text-main/80">{formatTimeAgo(candidate.createdAt)}</span>
              </div>
              {candidate.location && (
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-text-sub/60">所在城市</span>
                  <span className="text-text-main/80">{candidate.location}</span>
                </div>
              )}
            </div>

            <div className="mt-auto space-y-3">
              <button className="w-full h-10 rounded-md bg-white/5 border border-border-subtle text-[12px] font-medium text-text-sub/80 hover:bg-white/10 hover:text-text-main transition-all">
                移入公海池
              </button>
              <button className="w-full h-10 rounded-md bg-error/5 border border-error/20 text-[12px] font-medium text-error/80 hover:bg-error/10 hover:text-error transition-all">
                淘汰此候选人
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CandidateDetailModal;
