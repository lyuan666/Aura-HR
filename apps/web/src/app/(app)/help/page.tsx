'use client';

import React, { useMemo, useState } from 'react';
import { Empty, Input, Tag } from 'antd';
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  FileText,
  HelpCircle,
  Import,
  Kanban,
  LayoutDashboard,
  Mail,
  Rocket,
  Search,
  Settings,
  Sparkles,
  UsersRound,
  Workflow,
} from 'lucide-react';
import { helpFaqs, helpModules, type HelpModule } from '@/data/help-center';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ReactNode> = {
  rocket: <Rocket size={20} />,
  dashboard: <LayoutDashboard size={20} />,
  users: <UsersRound size={20} />,
  import: <Import size={20} />,
  building: <Building2 size={20} />,
  briefcase: <BriefcaseBusiness size={20} />,
  sparkles: <Sparkles size={20} />,
  kanban: <Kanban size={20} />,
  mail: <Mail size={20} />,
  file: <FileText size={20} />,
  chart: <BarChart3 size={20} />,
  calendar: <CalendarClock size={20} />,
  settings: <Settings size={20} />,
  portal: <Workflow size={20} />,
  help: <HelpCircle size={20} />,
};

const searchableText = (module: HelpModule) => [
  module.title,
  module.description,
  ...module.keywords,
  ...module.quickActions,
  ...module.sections.flatMap((section) => [section.title, section.body, ...(section.steps || [])]),
].join(' ').toLowerCase();

export default function HelpPage() {
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState(helpModules[0]?.id || '');

  const normalizedQuery = query.trim().toLowerCase();

  const filteredModules = useMemo(() => {
    if (!normalizedQuery) return helpModules;
    return helpModules.filter((module) => searchableText(module).includes(normalizedQuery));
  }, [normalizedQuery]);

  const activeModule = useMemo(() => {
    return helpModules.find((module) => module.id === activeId) || filteredModules[0] || helpModules[0];
  }, [activeId, filteredModules]);

  const filteredFaqs = useMemo(() => {
    if (!normalizedQuery) return helpFaqs;
    return helpFaqs.filter((faq) => [faq.question, faq.answer, ...faq.keywords].join(' ').toLowerCase().includes(normalizedQuery));
  }, [normalizedQuery]);

  const handleModuleSelect = (module: HelpModule) => {
    setActiveId(module.id);
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 pb-10">
      <section className="rounded-lg border border-border-subtle bg-bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-primary/25 bg-brand-primary/10 px-3 py-1 text-xs font-medium text-brand-primary">
              <HelpCircle size={14} />
              帮助中心
            </div>
            <h1 className="text-2xl font-bold text-text-main sm:text-3xl">从入门到交付的完整操作手册</h1>
            <p className="mt-3 text-sm leading-6 text-text-sub">
              按实际招聘工作流组织说明，快速查找候选人、客户、职位、匹配、交付、邮箱、合同和系统设置相关操作。
            </p>
          </div>

          <div className="w-full lg:w-[360px]">
            <Input
              size="large"
              allowClear
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              prefix={<Search size={18} className="text-text-sub" />}
              placeholder="搜索：上传简历、飞书导入、客户门户..."
              className="h-11 rounded-lg border-border-subtle bg-bg-base text-text-main"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {helpModules.slice(0, 4).map((module) => (
          <button
            key={module.id}
            onClick={() => handleModuleSelect(module)}
            className={cn(
              'min-h-[118px] rounded-lg border p-4 text-left transition-all',
              activeModule?.id === module.id
                ? 'border-brand-primary/50 bg-brand-primary/10'
                : 'border-border-subtle bg-bg-surface hover:border-brand-primary/30 hover:bg-hover',
            )}
          >
            <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/12 text-brand-primary">
              {iconMap[module.icon] || <HelpCircle size={20} />}
            </span>
            <span className="block text-sm font-semibold text-text-main">{module.title}</span>
            <span className="mt-1 block text-xs leading-5 text-text-sub">{module.description}</span>
          </button>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-border-subtle bg-bg-surface p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-text-main">模块文档</h2>
              <p className="mt-1 text-xs text-text-sub">选择一个模块查看使用场景、操作步骤和注意事项。</p>
            </div>
            {normalizedQuery && (
              <Tag color="blue" className="m-0 shrink-0">
                {filteredModules.length} 个结果
              </Tag>
            )}
          </div>

          {filteredModules.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-subtle py-12">
              <Empty description="没有找到匹配的帮助内容" />
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
              <nav className="flex max-h-[620px] flex-col gap-2 overflow-y-auto pr-1">
                {filteredModules.map((module) => (
                  <button
                    key={module.id}
                    onClick={() => handleModuleSelect(module)}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border px-3 py-3 text-left transition-all',
                      activeModule?.id === module.id
                        ? 'border-brand-primary/45 bg-brand-primary/10 text-brand-primary'
                        : 'border-border-subtle bg-bg-base text-text-sub hover:border-brand-primary/30 hover:text-text-main',
                    )}
                  >
                    <span className="mt-0.5 shrink-0">{iconMap[module.icon] || <HelpCircle size={18} />}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{module.title}</span>
                      <span className="mt-1 line-clamp-2 block text-xs leading-5 text-text-sub">{module.description}</span>
                    </span>
                  </button>
                ))}
              </nav>

              {activeModule && (
                <article className="min-w-0 rounded-lg border border-border-subtle bg-bg-base p-4 sm:p-5">
                  <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/12 text-brand-primary">
                        {iconMap[activeModule.icon] || <HelpCircle size={20} />}
                      </div>
                      <h3 className="text-xl font-semibold text-text-main">{activeModule.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-text-sub">{activeModule.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      {activeModule.quickActions.map((action) => (
                        <Tag key={action} className="m-0 border-border-subtle bg-hover text-text-sub">
                          {action}
                        </Tag>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
                    <aside className="rounded-lg border border-border-subtle bg-bg-surface p-3">
                      <div className="mb-2 text-xs font-semibold uppercase text-text-sub">目录</div>
                      <div className="flex flex-col gap-1">
                        {activeModule.sections.map((section, index) => (
                          <a
                            key={section.title}
                            href={`#help-${activeModule.id}-${index}`}
                            className="rounded-md px-2 py-2 text-xs text-text-sub transition-colors hover:bg-hover hover:text-text-main"
                          >
                            {index + 1}. {section.title}
                          </a>
                        ))}
                      </div>
                    </aside>

                    <div className="space-y-4">
                      {activeModule.sections.map((section, index) => (
                        <section
                          key={section.title}
                          id={`help-${activeModule.id}-${index}`}
                          className="rounded-lg border border-border-subtle bg-bg-surface p-4"
                        >
                          <h4 className="text-base font-semibold text-text-main">{section.title}</h4>
                          <p className="mt-2 text-sm leading-6 text-text-sub">{section.body}</p>
                          {section.steps && (
                            <ol className="mt-4 space-y-3">
                              {section.steps.map((step, stepIndex) => (
                                <li key={step} className="flex gap-3 text-sm leading-6 text-text-sub">
                                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-primary/12 text-xs font-semibold text-brand-primary">
                                    {stepIndex + 1}
                                  </span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          )}
                        </section>
                      ))}
                    </div>
                  </div>
                </article>
              )}
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-5">
          <section className="rounded-lg border border-border-subtle bg-bg-surface p-4">
            <h2 className="text-base font-semibold text-text-main">常见问题</h2>
            <div className="mt-4 space-y-3">
              {filteredFaqs.length === 0 ? (
                <p className="text-sm text-text-sub">没有匹配的常见问题。</p>
              ) : (
                filteredFaqs.map((faq) => (
                  <div key={faq.question} className="rounded-lg border border-border-subtle bg-bg-base p-3">
                    <h3 className="text-sm font-semibold text-text-main">{faq.question}</h3>
                    <p className="mt-2 text-xs leading-5 text-text-sub">{faq.answer}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-lg border border-brand-primary/25 bg-brand-primary/10 p-4">
            <h2 className="text-base font-semibold text-text-main">排错顺序</h2>
            <ol className="mt-3 space-y-2 text-sm leading-6 text-text-sub">
              <li>1. 刷新页面并确认当前账号权限。</li>
              <li>2. 检查筛选条件是否过窄。</li>
              <li>3. 确认 API、Web 和数据库服务在线。</li>
              <li>4. 记录页面路径、操作步骤和错误提示后交给管理员。</li>
            </ol>
          </section>
        </aside>
      </section>
    </div>
  );
}
