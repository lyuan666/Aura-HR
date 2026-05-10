'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Select, Segmented, App, Modal, Form, Input, DatePicker, Tag, Empty, Spin } from 'antd';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Video,
  Phone,
  User,
  Building2,
} from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import api from '@/lib/api';

dayjs.extend(isoWeek);

interface InterviewItem {
  id: string;
  candidateId: string;
  candidateName: string;
  jobPositionId: string;
  jobTitle: string;
  status: string;
  interviewDate: string;
  interviewReport: any;
  createdAt: string;
  updatedAt: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  interview_scheduled: { label: '已排期', color: '#B0C4DE', bg: 'rgba(176,196,222,0.12)' },
  interviewed: { label: '已面试', color: '#27C24C', bg: 'rgba(39,194,76,0.12)' },
  pending: { label: '待处理', color: '#EBCB8B', bg: 'rgba(235,203,139,0.12)' },
  reviewing: { label: '评估中', color: '#B0C4DE', bg: 'rgba(176,196,222,0.12)' },
  offer_sent: { label: '已发 Offer', color: '#27C24C', bg: 'rgba(39,194,76,0.12)' },
  rejected: { label: '已淘汰', color: '#BF616A', bg: 'rgba(191,97,106,0.12)' },
  accepted: { label: '已接受', color: '#27C24C', bg: 'rgba(39,194,76,0.12)' },
  withdrawn: { label: '已撤回', color: '#636E72', bg: 'rgba(99,110,114,0.12)' },
};

const METHOD_ICONS: Record<string, React.ReactNode> = {
  '远程视频': <Video size={12} />,
  '电话': <Phone size={12} />,
  '现场': <MapPin size={12} />,
};

export default function InterviewsPage() {
  const { message, modal } = App.useApp();
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [viewMode, setViewMode] = useState<'周' | '月'>('周');
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterJob, setFilterJob] = useState<string | undefined>(undefined);
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);

  // 计算当前周/月的日期范围
  const dateRange = useMemo(() => {
    if (viewMode === '周') {
      const start = currentDate.startOf('isoWeek');
      const end = currentDate.endOf('isoWeek');
      return { start, end };
    }
    const start = currentDate.startOf('month');
    const end = currentDate.endOf('month');
    return { start, end };
  }, [currentDate, viewMode]);

  // 获取面试数据
  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: 1,
        pageSize: 100,
        status: 'interview_scheduled,interviewed',
        startDate: dateRange.start.format('YYYY-MM-DD'),
        endDate: dateRange.end.format('YYYY-MM-DD'),
      };
      if (filterStatus) params.status = filterStatus;
      const res = await api.get('/recommendations', { params });
      setInterviews(res.data.items || []);
    } catch (e: any) {
      message.error('加载面试数据失败');
    } finally {
      setLoading(false);
    }
  }, [dateRange, filterStatus, message]);

  // 获取职位列表（用于筛选）
  const fetchJobs = useCallback(async () => {
    try {
      const res = await api.get('/job-positions', { params: { page: 1, pageSize: 100 } });
      setJobs((res.data.items || res.data || []).map((j: any) => ({ id: j.id, title: j.title })));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // 导航
  const goToday = () => setCurrentDate(dayjs());
  const goPrev = () => setCurrentDate(viewMode === '周' ? currentDate.subtract(1, 'week') : currentDate.subtract(1, 'month'));
  const goNext = () => setCurrentDate(viewMode === '周' ? currentDate.add(1, 'week') : currentDate.add(1, 'month'));

  // 按日期分组
  const interviewsByDate = useMemo(() => {
    const map: Record<string, InterviewItem[]> = {};
    interviews.forEach((item) => {
      if (filterJob && item.jobPositionId !== filterJob) return;
      const dateKey = item.interviewDate
        ? dayjs(item.interviewDate).format('YYYY-MM-DD')
        : 'unscheduled';
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(item);
    });
    return map;
  }, [interviews, filterJob]);

  // 生成周视图的天数组
  const weekDays = useMemo(() => {
    const days: Dayjs[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(dateRange.start.add(i, 'day'));
    }
    return days;
  }, [dateRange]);

  // 今日面试数
  const todayCount = (interviewsByDate[dayjs().format('YYYY-MM-DD')] || []).length;

  // 安排面试弹窗
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState<InterviewItem | null>(null);
  const [scheduleForm] = Form.useForm();

  const openScheduleModal = (item: InterviewItem) => {
    setScheduleTarget(item);
    scheduleForm.setFieldsValue({
      interviewDate: item.interviewDate ? dayjs(item.interviewDate) : undefined,
    });
    setScheduleModalOpen(true);
  };

  const handleSchedule = async () => {
    if (!scheduleTarget) return;
    try {
      const values = await scheduleForm.validateFields();
      await api.patch(`/recommendations/${scheduleTarget.id}/schedule`, {
        interviewDate: values.interviewDate.toISOString(),
      });
      message.success('面试时间已更新');
      setScheduleModalOpen(false);
      fetchInterviews();
    } catch (e: any) {
      if (e.errorFields) return;
      message.error('更新失败');
    }
  };

  // 更新状态
  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/recommendations/${id}/status`, { status });
      message.success('状态已更新');
      fetchInterviews();
    } catch {
      message.error('状态更新失败');
    }
  };

  const weekLabel = `${currentDate.isoWeekYear()}-${String(currentDate.isoWeek()).padStart(2, '0')}周`;

  return (
    <div className="flex h-full flex-col overflow-hidden text-text-main">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="m-0 text-[30px] font-black tracking-tight">面试管理</h1>
            <span className="text-[15px] text-text-sub">
              今日有 <span className="font-bold text-brand-primary">{todayCount}</span> 条面试待处理
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-4 gap-x-16 gap-y-4">
        <div className="grid grid-cols-[88px_1fr] items-center gap-4">
          <span className="text-[14px] font-medium text-text-sub">面试状态</span>
          <Select
            allowClear
            placeholder="全部状态"
            className="h-11"
            value={filterStatus}
            onChange={setFilterStatus}
            options={Object.entries(STATUS_MAP).map(([key, val]) => ({ value: key, label: val.label }))}
          />
        </div>
        <div className="grid grid-cols-[88px_1fr] items-center gap-4">
          <span className="text-[14px] font-medium text-text-sub">职位</span>
          <Select
            allowClear
            showSearch
            placeholder="全部职位"
            className="h-11"
            value={filterJob}
            onChange={setFilterJob}
            optionFilterProp="label"
            options={jobs.map((j) => ({ value: j.id, label: j.title }))}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={goToday}
            className="h-10 rounded-md border border-border-subtle bg-bg-surface px-4 text-sm font-medium text-text-main transition-colors hover:bg-bg-elevated"
          >
            今天
          </button>
          <button
            onClick={goPrev}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-border-subtle bg-bg-surface text-text-sub transition-colors hover:bg-bg-elevated"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={goNext}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-border-subtle bg-bg-surface text-text-sub transition-colors hover:bg-bg-elevated"
          >
            <ChevronRight size={16} />
          </button>
          <span className="flex items-center gap-2 text-sm font-medium text-text-main">
            <CalendarDays size={15} />
            {viewMode === '周' ? weekLabel : currentDate.format('YYYY年MM月')}
          </span>
        </div>
        <Segmented
          options={['周', '月']}
          value={viewMode}
          onChange={(v) => setViewMode(v as '周' | '月')}
        />
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spin size="large" />
        </div>
      ) : (
        <div className="mt-auto grid flex-1 grid-cols-7 overflow-hidden rounded-lg border border-border-subtle bg-bg-surface/35">
          {weekDays.map((day, index) => {
            const dateKey = day.format('YYYY-MM-DD');
            const isToday = day.isSame(dayjs(), 'day');
            const dayInterviews = interviewsByDate[dateKey] || [];

            return (
              <div
                key={dateKey}
                className={[
                  'flex min-h-0 flex-col border-r border-border-subtle last:border-r-0',
                  isToday ? 'bg-bg-elevated/45' : '',
                ].join(' ')}
              >
                <div className={[
                  'border-b border-border-subtle px-5 py-3 text-center text-[13px] font-bold',
                  isToday ? 'text-brand-primary' : 'text-text-main',
                ].join(' ')}>
                  <div>{day.format('MM-DD')}</div>
                  <div className="text-[11px] font-normal text-text-sub">
                    {['周一','周二','周三','周四','周五','周六','周日'][day.isoWeekday() - 1]}
                  </div>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto p-3">
                  {dayInterviews.map((item) => {
                    const st = STATUS_MAP[item.status] || STATUS_MAP.pending;
                    const interviewTime = item.interviewDate ? dayjs(item.interviewDate).format('HH:mm') : '--:--';
                    const method = '远程视频'; // 默认，后续可扩展
                    return (
                      <div
                        key={item.id}
                        onClick={() => openScheduleModal(item)}
                        className="cursor-pointer rounded-md border border-transparent p-3 transition-all hover:border-border-subtle hover:shadow-sm"
                        style={{ background: st.bg }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-bold" style={{ color: st.color }}>
                            {st.label}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-text-sub">
                            <Clock size={10} />
                            {interviewTime}
                          </span>
                        </div>
                        <div className="mt-1.5 text-[12px] font-medium text-text-main">
                          {item.candidateName || '未知候选人'}
                        </div>
                        <div className="mt-0.5 text-[11px] text-text-sub">
                          {item.jobTitle || '未知职位'}
                        </div>
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-text-sub">
                          {METHOD_ICONS[method] || <MapPin size={10} />}
                          {method}
                        </div>
                      </div>
                    );
                  })}
                  {dayInterviews.length === 0 && (
                    <div className="flex h-16 items-center justify-center text-[11px] text-text-sub/40">
                      暂无面试
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Modal */}
      <Modal
        open={scheduleModalOpen}
        onCancel={() => setScheduleModalOpen(false)}
        onOk={handleSchedule}
        title={scheduleTarget ? `${scheduleTarget.candidateName} — 面试安排` : '面试安排'}
        okText="保存"
        cancelText="取消"
        styles={{
          content: { backgroundColor: 'var(--bg-surface)' },
          header: { backgroundColor: 'var(--bg-surface)' },
          body: { backgroundColor: 'var(--bg-surface)' },
        }}
      >
        {scheduleTarget && (
          <div className="mb-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-text-sub">
              <User size={14} />
              候选人：<span className="text-text-main">{scheduleTarget.candidateName}</span>
            </div>
            <div className="flex items-center gap-2 text-text-sub">
              <Building2 size={14} />
              职位：<span className="text-text-main">{scheduleTarget.jobTitle}</span>
            </div>
            <div className="flex items-center gap-2 text-text-sub">
              <span className="inline-block w-[14px] text-center text-[10px]">
                {STATUS_MAP[scheduleTarget.status]?.label?.charAt(0) || '?'}
              </span>
              状态：
              <Tag color={STATUS_MAP[scheduleTarget.status]?.color}>
                {STATUS_MAP[scheduleTarget.status]?.label || scheduleTarget.status}
              </Tag>
            </div>
          </div>
        )}
        <Form form={scheduleForm} layout="vertical">
          <Form.Item name="interviewDate" label="面试时间" rules={[{ required: true, message: '请选择面试时间' }]}>
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              className="w-full"
              placeholder="选择面试日期和时间"
            />
          </Form.Item>
        </Form>

        {scheduleTarget?.status === 'interview_scheduled' && (
          <div className="mt-4 flex gap-2 border-t border-border-subtle pt-4">
            <button
              onClick={() => { updateStatus(scheduleTarget.id, 'interviewed'); setScheduleModalOpen(false); }}
              className="flex-1 rounded-md bg-success/10 py-2 text-sm font-medium text-success transition-colors hover:bg-success/20"
            >
              标记已面试
            </button>
            <button
              onClick={() => { updateStatus(scheduleTarget.id, 'rejected'); setScheduleModalOpen(false); }}
              className="flex-1 rounded-md bg-error/10 py-2 text-sm font-medium text-error transition-colors hover:bg-error/20"
            >
              淘汰
            </button>
            <button
              onClick={() => { updateStatus(scheduleTarget.id, 'withdrawn'); setScheduleModalOpen(false); }}
              className="flex-1 rounded-md bg-text-sub/10 py-2 text-sm font-medium text-text-sub transition-colors hover:bg-text-sub/20"
            >
              撤回
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
