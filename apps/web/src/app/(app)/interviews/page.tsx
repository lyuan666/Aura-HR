'use client';

import React from 'react';
import { Button, Select, Segmented } from 'antd';
import { CalendarDays, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';

const days = [
  '04-27 周一',
  '04-28 周二',
  '04-29 周三',
  '04-30 周四',
  '05-01 周五',
  '05-02 周六',
  '05-03 周日',
];

export default function InterviewsPage() {
  return (
    <div className="flex h-full flex-col overflow-hidden text-text-main">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="m-0 text-[30px] font-black tracking-tight">面试管理</h1>
            <span className="text-[15px] text-text-sub">
              Hi~您今日有 <span className="font-bold text-brand-primary">4</span> 条面试待处理
            </span>
          </div>
        </div>
        <Button
          icon={<LayoutGrid size={16} />}
          className="h-10 rounded-md border-border-subtle bg-bg-surface text-text-sub"
        />
      </div>

      <div className="grid grid-cols-4 gap-x-16 gap-y-6">
        {['职位', 'HR', '面试官', '面试形式', '面试轮次', '面试结果'].map((label) => (
          <div key={label} className="grid grid-cols-[88px_1fr] items-center gap-4">
            <span className="text-[14px] font-medium text-text-sub">{label}</span>
            <Select
              placeholder={`请选择${label}`}
              className="h-11"
              options={[]}
              suffixIcon={<ChevronRight size={14} className="rotate-90 text-text-sub" />}
            />
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button className="h-10 rounded-md border-border-subtle bg-bg-surface text-text-main">
            今天
          </Button>
          <Button
            icon={<ChevronLeft size={16} />}
            className="h-10 rounded-md border-border-subtle bg-bg-surface text-text-sub"
          />
          <Button
            icon={<ChevronRight size={16} />}
            className="h-10 rounded-md border-border-subtle bg-bg-surface text-text-sub"
          />
          <Button
            icon={<CalendarDays size={15} />}
            iconPosition="end"
            className="h-10 rounded-md border-border-subtle bg-bg-surface text-text-main"
          >
            2026-18周
          </Button>
        </div>
        <Segmented options={['周', '月']} defaultValue="周" />
      </div>

      <div className="mt-8 grid flex-1 grid-cols-7 overflow-hidden rounded-lg border border-border-subtle bg-bg-surface/35">
        {days.map((day, index) => (
          <div
            key={day}
            className={[
              'flex min-h-0 flex-col border-r border-border-subtle last:border-r-0',
              index === 3 ? 'bg-bg-elevated/45' : '',
            ].join(' ')}
          >
            <div className="border-b border-border-subtle px-5 py-4 text-center text-[14px] font-bold text-text-main">
              {day}
            </div>
            <div className="flex-1 p-4">
              {index === 3 && (
                <div className="rounded-md border border-brand-primary/20 bg-brand-primary/10 p-4">
                  <div className="text-[13px] font-bold text-text-main">候选人一面</div>
                  <div className="mt-1 text-[12px] text-text-sub">10:30 · 远程视频</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
