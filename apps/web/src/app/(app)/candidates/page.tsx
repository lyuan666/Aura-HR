'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Star, Settings2, Eraser, Briefcase, GraduationCap } from 'lucide-react';
import api from '@/lib/api';
import CandidateDetailModal from '@/components/candidates/CandidateDetailModal';
import ResumeUploadModal from '@/components/candidates/ResumeUploadModal';
import { demoCandidates } from '@/data/demoCandidates';
import { App, Skeleton, Empty, Tag, Checkbox, Button, Input, Avatar } from 'antd';
import { UploadOutlined, MailOutlined } from '@ant-design/icons';
import { cn } from '@/lib/utils';

interface TimelineItem {
  startDate?: string;
  start?: string;
  from?: string;
  endDate?: string;
  end?: string;
  to?: string;
  duration?: string;
}

interface WorkExperience extends TimelineItem {
  companyName?: string;
  company?: string;
  position?: string;
  title?: string;
}

interface EducationExperience extends TimelineItem {
  school?: string;
  schoolName?: string;
  degree?: string;
  degreeLevel?: string;
}

interface CandidateRecord {
  id?: string;
  avatar?: string;
  name?: string;
  gender?: string;
  age?: number;
  degree?: string;
  totalYears?: number;
  status?: string;
  currentCompany?: string;
  currentTitle?: string;
  school?: string;
  resumeUrl?: string;
  workExperiences?: WorkExperience[];
  educationHistory?: EducationExperience[];
}

const formatPeriod = (item?: TimelineItem | null) => {
  const start = item?.startDate || item?.start || item?.from;
  const end = item?.endDate || item?.end || item?.to || (start ? '至今' : '');
  if (!start && !end && item?.duration) return item.duration;
  if (!start && !end) return '';
  return `${start || '--'}-${end || '--'}`;
};

const getLatestWork = (candidate: CandidateRecord) => {
  const firstWork = Array.isArray(candidate.workExperiences) ? candidate.workExperiences[0] : null;
  return {
    period: formatPeriod(firstWork),
    company: candidate.currentCompany || firstWork?.companyName || firstWork?.company || '',
    title: candidate.currentTitle || firstWork?.position || firstWork?.title || '',
  };
};

const getPreviousWork = (candidate: CandidateRecord) => {
  const secondWork = Array.isArray(candidate.workExperiences) ? candidate.workExperiences[1] : null;
  if (!secondWork) return null;

  return {
    period: formatPeriod(secondWork),
    company: secondWork.companyName || secondWork.company || '',
    title: secondWork.position || secondWork.title || '',
  };
};

const getEducation = (candidate: CandidateRecord) => {
  const firstEdu = Array.isArray(candidate.educationHistory) ? candidate.educationHistory[0] : null;
  return {
    period: formatPeriod(firstEdu),
    school: candidate.school || firstEdu?.school || firstEdu?.schoolName || '',
    degree: candidate.degree || firstEdu?.degree || firstEdu?.degreeLevel || '',
  };
};

export default function CandidatesPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [usingDemoData, setUsingDemoData] = useState(false);

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/candidates');
      const items = res.data?.items || [];
      if (Array.isArray(items) && items.length > 0) {
        setCandidates(items);
        setUsingDemoData(false);
        return;
      }

      setCandidates(demoCandidates);
      setUsingDemoData(true);
    } catch (e) {
      console.error(e);
      setCandidates(demoCandidates);
      setUsingDemoData(true);
      message.warning('当前还没有正式人才数据，先展示演示卡片');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter(
      (c) =>
        !searchQuery ||
        [c.name, c.currentTitle, c.currentCompany].some((f) =>
          f?.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );
  }, [candidates, searchQuery]);

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg-base px-0 py-2 text-text-main">
      {/* 1. Header Area */}
      <div className="mb-4 flex flex-shrink-0 items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <h1
              className="shrink-0 whitespace-nowrap text-xl font-bold tracking-wide text-text-main"
              style={{ margin: 0 }}
            >
              全部简历
            </h1>
            {usingDemoData && (
              <Tag className="m-0 rounded-full border-none bg-brand-primary/12 px-3 py-1 text-[11px] font-semibold text-brand-primary">
                演示数据
              </Tag>
            )}
          </div>
          <Input
            placeholder="在结果中搜索姓名、职位、公司..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-80 bg-bg-surface/50 border-border-subtle rounded-md hover:border-brand-primary/50 focus:border-brand-primary/50 focus:bg-bg-surface transition-all placeholder:text-text-sub/40 text-sm"
            allowClear
          />
        </div>
        <div className="flex gap-3">
          <Button
            icon={<UploadOutlined />}
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-brand-primary border-none text-bg-base font-bold rounded-md hover:bg-brand-primary/90"
          >
            上传简历
          </Button>
          <Button
            icon={<MailOutlined />}
            className="bg-bg-surface border-border-subtle text-text-sub rounded-md"
          >
            邮箱归集
          </Button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="mb-3 flex flex-shrink-0 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {['标签', '上传方式', '当前职位', '当前流程'].map((label) => (
            <Tag
              key={label}
              className="m-0 bg-bg-surface border-border-subtle text-text-sub cursor-pointer px-3 py-1 rounded-lg"
            >
              {label} <ChevronDown size={10} className="inline ml-1 opacity-50" />
            </Tag>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Button
            type="text"
            size="small"
            className="text-text-sub hover:text-text-main"
            icon={<Settings2 size={14} />}
          >
            筛选设置
          </Button>
          <Button
            type="text"
            size="small"
            className="text-text-sub hover:text-text-main"
            icon={<Eraser size={14} />}
          >
            清空
          </Button>
        </div>
      </div>

      {/* 3. Bulk Action Bar */}
      <div className="mb-2 flex flex-shrink-0 items-center justify-between border-b border-border-subtle py-2">
        <div className="flex items-center gap-4">
          <Checkbox />
          <span className="text-[12px] text-text-sub/50">
            共{' '}
            <span className="text-brand-primary font-bold mx-0.5">{filteredCandidates.length}</span>{' '}
            名
          </span>

          <div className="flex items-center gap-2 ml-2">
            <Button size="small" className="bg-bg-surface border-border-subtle text-text-sub">
              简历管理
            </Button>
            <Button size="small" className="bg-bg-surface border-border-subtle text-text-sub">
              加入职位
            </Button>
            <Button size="small" className="bg-bg-surface border-border-subtle text-text-sub">
              分享
            </Button>
            <Button size="small" className="bg-bg-surface border-border-subtle text-text-sub">
              导出
            </Button>
          </div>
        </div>
        <Button type="text" size="small" className="text-text-sub" icon={<ChevronDown size={14} />}>
          默认综合排序
        </Button>
      </div>

      {/* 4. List Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
        <div className="flex flex-col">
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <Skeleton
                  key={i}
                  active
                  avatar
                  paragraph={{ rows: 2 }}
                  style={{ padding: '20px 0' }}
                />
              ))
            : filteredCandidates.map((c, i) => {
                const latestWork = getLatestWork(c);
                const previousWork = getPreviousWork(c);
                const education = getEducation(c);

                return (
                  <motion.div
                    key={c.id || i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => {
                      setSelectedCandidate(c);
                      setIsModalOpen(true);
                    }}
                    className="group flex items-start py-5 border-b border-border-subtle hover:bg-bg-elevated/30 transition-colors cursor-pointer"
                  >
                    {/* Left Column: Identity */}
                    <div className="flex items-start w-[320px] flex-shrink-0 pl-1 relative">
                      <Checkbox className="mt-2" onClick={(e) => e.stopPropagation()} />
                      <div className="ml-4 flex gap-4">
                        <div className="relative flex-shrink-0">
                          <Avatar
                            src={c.avatar}
                            size={40}
                            className={cn(
                              'border border-border-subtle',
                              c.gender === 'female'
                                ? 'bg-error/10 text-error'
                                : 'bg-brand-primary/10 text-brand-primary',
                            )}
                          >
                            {c.name?.[0] || '?'}
                          </Avatar>
                        </div>
                        <div className="min-w-0 pr-8 relative">
                          <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                            <span className="text-[14px] font-semibold text-text-main">
                              {c.name || '未知姓名'}
                            </span>
                            <span className="text-[12px] text-text-sub/50">
                              {[
                                c.age ? `${c.age}岁` : '',
                                c.degree,
                                c.totalYears ? `${c.totalYears}年` : '',
                              ]
                                .filter(Boolean)
                                .join(' | ') || '基础信息待完善'}
                            </span>
                          </div>
                          <div className="mt-2">
                            <Tag className="m-0 bg-brand-primary/10 border-none text-brand-light text-[11px] px-2 py-0.5 rounded">
                              {c.status === 'new' ? '稳定性高' : '暂无标签'}
                            </Tag>
                          </div>
                          <div className="absolute right-0 top-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Star
                              size={14}
                              className="text-text-sub hover:text-warning cursor-pointer transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Middle Column: Timeline */}
                    <div className="flex-1 px-4 relative flex flex-col gap-3 pb-1">
                      <div className="absolute left-[23px] top-[18px] bottom-4 border-l border-dashed border-border-subtle/50" />

                      {/* Experience Item 1 */}
                      <div className="flex items-start relative z-10 group/row">
                        <div className="flex items-start gap-3 w-full">
                          <div className="pt-1">
                            <Briefcase size={12} className="text-text-sub/40" />
                          </div>
                          <div className="min-w-0 pt-[1px] flex flex-col">
                            <div className="text-[13px] font-medium flex items-center gap-3">
                              <span className="text-[11px] w-[120px] shrink-0 whitespace-nowrap text-text-sub/40 font-mono">
                                {latestWork.period || '--'}
                              </span>
                              {latestWork.company || latestWork.title ? (
                                <div className="flex items-center gap-2">
                                  {latestWork.company && (
                                    <span className="text-brand-primary hover:underline cursor-pointer">
                                      {latestWork.company}
                                    </span>
                                  )}
                                  {latestWork.company && latestWork.title && (
                                    <span className="opacity-20 text-text-sub">-</span>
                                  )}
                                  {latestWork.title && (
                                    <span className="text-text-main/80">{latestWork.title}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-text-sub/40">暂无当前任职信息</span>
                              )}
                            </div>
                            {previousWork && (
                              <div className="text-[12px] mt-1.5 flex items-center gap-3 text-text-sub/30">
                                <span className="w-[120px] shrink-0 whitespace-nowrap">
                                  {previousWork.period || '--'}
                                </span>
                                <div className="flex items-center gap-2">
                                  {previousWork.company && (
                                    <span className="hover:underline cursor-pointer text-text-sub/50">
                                      {previousWork.company}
                                    </span>
                                  )}
                                  {previousWork.company && previousWork.title && (
                                    <span className="opacity-10">-</span>
                                  )}
                                  {previousWork.title && <span>{previousWork.title}</span>}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Education Item */}
                      <div className="flex items-start relative z-10 mt-1">
                        <div className="flex items-start gap-3 w-full">
                          <div className="pt-0.5">
                            <GraduationCap size={14} className="text-text-sub/30" />
                          </div>
                          <div className="min-w-0 pt-[1px] flex items-center gap-3 text-[13px] text-text-sub/80">
                            <span className="text-[12px] w-[120px] shrink-0 whitespace-nowrap text-text-sub/40">
                              {education.period || '--'}
                            </span>
                            <div className="flex items-center gap-2">
                              {education.school || education.degree ? (
                                <>
                                  {education.school && (
                                    <span className="hover:underline cursor-pointer">
                                      {education.school}
                                    </span>
                                  )}
                                  {education.school && education.degree && (
                                    <span className="opacity-20">-</span>
                                  )}
                                  {education.degree && <span>{education.degree}</span>}
                                </>
                              ) : (
                                <span className="text-text-sub/40">暂无教育信息</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Actions */}
                    <div className="w-[180px] flex items-start justify-end gap-2 flex-shrink-0 pr-4 mt-0.5">
                      <Button
                        size="small"
                        className="bg-bg-surface border-border-subtle text-text-sub"
                      >
                        加入分组
                      </Button>
                      <Button
                        size="small"
                        className="bg-bg-surface border-border-subtle text-text-sub"
                      >
                        备注
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
        </div>

        {!loading && filteredCandidates.length === 0 && (
          <div className="py-32 flex flex-col items-center justify-center">
            <Empty description="暂无数据" />
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
