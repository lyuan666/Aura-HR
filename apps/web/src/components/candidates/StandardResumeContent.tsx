'use client';

import React from 'react';
import { Tag, Empty } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { cn } from '@/lib/utils';

/* ── 类型定义 ── */

interface WorkExperience {
  companyName?: string;
  company?: string;
  position?: string;
  duration?: string;
  content?: string | string[];
  description?: string;
  department?: string;
  reportTo?: string;
  subordinates?: string | number;
  achievements?: string;
  awards?: string;
  leaveReason?: string;
}

interface EducationExperience {
  school?: string;
  degree?: string;
  degreeLevel?: string;
  major?: string;
  duration?: string;
  activities?: string;
}

interface ProjectExperience {
  projectName?: string;
  role?: string;
  duration?: string;
  description?: string;
  achievements?: string;
}

interface CareerExpectation {
  desiredPosition?: string;
  desiredLocation?: string[];
  desiredSalary?: string;
  jobType?: string;
  industry?: string;
}

interface CandidateProfile {
  name?: string;
  gender?: string;
  age?: number;
  totalYears?: number;
  phone?: string;
  email?: string;
  location?: string;
  degree?: string;
  school?: string;
  major?: string;
  wechat?: string;
  currentCompany?: string;
  currentTitle?: string;
  workExperiences?: WorkExperience[];
  educationHistory?: EducationExperience[];
  projectExperiences?: ProjectExperience[];
  careerExpectations?: CareerExpectation | null;
  parsedTags?: {
    skills?: string[];
    desiredLocation?: string[];
    placeOfOrigin?: string;
  };
  selfEvaluation?: string;
}

interface CandidateProps {
  candidate: CandidateProfile | null;
}

/* ── 工具函数 ── */

/** 把一大段工作描述拆成一条一行 */
const splitDescription = (text: string): string[] => {
  if (!text) return [];
  // 按中文分号、句号后跟数字/换行切分；也按 \n 切
  const lines = text
    .split(/[；;]\s*|\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length > 1) return lines;
  // 如果没分号，按 "数字." 拆
  const numbered = text.match(/\d+[.、．]\s*.+?(?=\d+[.、．]|$)/g);
  if (numbered && numbered.length > 1) return numbered.map((s) => s.trim());
  return [text.trim()];
};

/** 计算时长 */
const calcDuration = (duration?: string): string => {
  if (!duration) return '';
  const parts = duration.split(/[-–—~～至]/);
  if (parts.length < 2) return duration;
  const parseDate = (s: string) => {
    const m = s.trim().match(/(\d{4})[./](\d{1,2})/);
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1);
  };
  const start = parseDate(parts[0]);
  const endText = parts[1].trim();
  const end = endText === '至今' || endText === 'present' ? new Date() : parseDate(endText);
  if (!start || !end) return duration;
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (months < 1) return duration;
  const y = Math.floor(months / 12);
  const m = months % 12;
  const yStr = y > 0 ? `${y}年` : '';
  const mStr = m > 0 ? `${m}个月` : '';
  return `${yStr}${mStr}` || duration;
};

/* ── 子组件 ── */

const SectionHeader = ({ title, showEdit = true }: { title: string; showEdit?: boolean }) => (
  <div className="flex items-center justify-between mb-5 group/header">
    <div className="flex items-center gap-2.5">
      <div className="w-1 h-5 bg-brand-primary rounded-sm" />
      <h3 className="text-[15px] font-bold text-text-main m-0">{title}</h3>
    </div>
    {showEdit && (
      <button className="flex items-center gap-1 text-[12px] text-text-sub/40 hover:text-brand-primary transition-colors opacity-0 group-hover/header:opacity-100">
        <EditOutlined /> 编辑
      </button>
    )}
  </div>
);

const InfoItem = ({
  label,
  value,
  span = 1,
}: {
  label: string;
  value?: string | number | null;
  span?: number;
}) => (
  <div className={cn('flex flex-col gap-1', span === 2 && 'col-span-2')}>
    <span className="text-[11px] text-text-sub/40 font-medium">{label}</span>
    <span className="text-[13px] text-text-main">{value || '--'}</span>
  </div>
);

/* ── 主组件 ── */

const StandardResumeContent: React.FC<CandidateProps> = ({ candidate }) => {
  if (!candidate) {
    return (
      <div className="py-32 flex flex-col items-center justify-center">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span className="text-text-sub/30 text-[12px]">暂无简历数据</span>}
        />
      </div>
    );
  }

  const workExp = candidate.workExperiences || [];
  const eduList = candidate.educationHistory || [];
  const projList = candidate.projectExperiences || [];
  const skills = Array.isArray(candidate.parsedTags?.skills) ? candidate.parsedTags.skills : [];
  const career = candidate.careerExpectations;
  const genderText = candidate.gender === 'female' ? '女' : candidate.gender === 'male' ? '男' : '--';

  return (
    <div className="px-10 py-8 flex flex-col gap-10 bg-bg-base text-text-main">

      {/* ── 1. 基本信息 ── */}
      <section>
        <SectionHeader title="基本信息" />
        <div className="grid grid-cols-4 gap-x-8 gap-y-5 bg-bg-elevated/20 border border-border-subtle rounded-xl p-6">
          <InfoItem label="姓名" value={candidate.name} />
          <InfoItem label="性别" value={genderText} />
          <InfoItem label="年龄" value={candidate.age ? `${candidate.age}岁` : null} />
          <InfoItem label="工作年限" value={candidate.totalYears ? `${candidate.totalYears}年` : null} />
          <InfoItem label="手机号码" value={candidate.phone} />
          <InfoItem label="邮箱" value={candidate.email} />
          <InfoItem label="微信号" value={candidate.wechat} />
          <InfoItem label="所在城市" value={candidate.location} />
          <InfoItem label="最高学历" value={candidate.degree} />
          <InfoItem label="毕业院校" value={candidate.school} />
          <InfoItem label="专业" value={candidate.major} />
          <InfoItem label="当前公司" value={candidate.currentCompany} />
        </div>
      </section>

      {/* ── 2. 求职期望 ── */}
      {(career || candidate.parsedTags?.desiredLocation?.length) && (
        <section>
          <SectionHeader title="求职期望" />
          <div className="grid grid-cols-4 gap-x-8 gap-y-5 bg-bg-elevated/20 border border-border-subtle rounded-xl p-6">
            <InfoItem label="期望职位" value={career?.desiredPosition} />
            <InfoItem label="期望城市" value={career?.desiredLocation?.join('、') || candidate.parsedTags?.desiredLocation?.join('、')} />
            <InfoItem label="期望薪资" value={career?.desiredSalary} />
            <InfoItem label="求职类型" value={career?.jobType} />
          </div>
        </section>
      )}

      {/* ── 3. 工作经历 ── */}
      <section>
        <SectionHeader title="工作经历" />
        {workExp.length === 0 ? (
          <div className="bg-bg-elevated/20 border border-border-subtle rounded-xl p-6 text-center text-text-sub/30 text-[12px]">
            暂无工作经历数据
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {workExp.map((exp, idx) => {
              const company = exp.companyName || exp.company || '--';
              const position = exp.position || '--';
              const dur = exp.duration || '--';
              const durLabel = calcDuration(dur);
              const descLines = splitDescription(exp.description || (Array.isArray(exp.content) ? exp.content.join('\n') : exp.content || ''));

              return (
                <div key={idx} className="border border-border-subtle rounded-xl overflow-hidden">
                  {/* 标题行 */}
                  <div className="flex items-center justify-between px-6 py-4 bg-bg-elevated/20 border-b border-border-subtle">
                    <div className="flex items-center gap-3">
                      <span className="text-[15px] font-bold text-text-main">{company}</span>
                      <span className="text-text-sub/20">|</span>
                      <span className="text-[14px] text-text-main/80">{position}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[12px] text-text-sub/50">
                      <span className="font-mono">{dur}</span>
                      {durLabel && dur !== durLabel && (
                        <span className="text-text-sub/30">({durLabel})</span>
                      )}
                    </div>
                  </div>

                  {/* 补充信息行 */}
                  {(exp.department || exp.reportTo || exp.subordinates) && (
                    <div className="px-6 py-2.5 border-b border-border-subtle flex items-center gap-6 text-[12px] text-text-sub/60">
                      {exp.department && <span>所在部门: {exp.department}</span>}
                      {exp.reportTo && <span>汇报对象: {exp.reportTo}</span>}
                      {exp.subordinates && <span>下属人数: {exp.subordinates}</span>}
                    </div>
                  )}

                  {/* 工作内容 */}
                  {descLines.length > 0 && descLines[0] && (
                    <div className="px-6 py-4">
                      <div className="text-[12px] text-text-sub/40 font-medium mb-2.5">工作内容:</div>
                      <div className="flex flex-col gap-1.5">
                        {descLines.map((line, i) => (
                          <div key={i} className="flex gap-2 items-start text-[13px] leading-6 text-text-main/75">
                            <span className="text-text-sub/20 mt-[2px] shrink-0">•</span>
                            <span>{line}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 工作业绩 */}
                  {exp.achievements && (
                    <div className="px-6 pb-4">
                      <div className="text-[12px] text-text-sub/40 font-medium mb-2">工作业绩:</div>
                      <div className="text-[13px] leading-6 text-text-main/75">{exp.achievements}</div>
                    </div>
                  )}

                  {/* 荣获奖项 */}
                  {exp.awards && (
                    <div className="px-6 pb-4">
                      <div className="text-[12px] text-text-sub/40 font-medium mb-2">荣获奖项:</div>
                      <div className="text-[13px] leading-6 text-text-main/75">{exp.awards}</div>
                    </div>
                  )}

                  {/* 离职原因 */}
                  {exp.leaveReason && (
                    <div className="px-6 pb-4 flex items-center gap-2 text-[12px] text-text-sub/50">
                      <span>离职原因:</span>
                      <span className="text-text-main/60">{exp.leaveReason}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 4. 项目经历 ── */}
      <section>
        <SectionHeader title="项目经历" />
        {projList.length === 0 ? (
          <div className="bg-bg-elevated/20 border border-border-subtle rounded-xl p-6 text-center text-text-sub/30 text-[12px]">
            暂无项目经历数据
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {projList.map((proj, idx) => {
              const dur = proj.duration || '--';
              const durLabel = calcDuration(dur);

              return (
                <div key={idx} className="border border-border-subtle rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 bg-bg-elevated/20 border-b border-border-subtle">
                    <div className="flex items-center gap-3">
                      <span className="text-[15px] font-bold text-text-main">
                        {proj.projectName || '--'}
                      </span>
                      {proj.role && (
                        <>
                          <span className="text-text-sub/20">|</span>
                          <span className="text-[13px] text-brand-primary">{proj.role}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[12px] text-text-sub/50">
                      <span className="font-mono">{dur}</span>
                      {durLabel && dur !== durLabel && (
                        <span className="text-text-sub/30">({durLabel})</span>
                      )}
                    </div>
                  </div>

                  {proj.description && (
                    <div className="px-6 py-4">
                      <div className="text-[12px] text-text-sub/40 font-medium mb-2.5">项目描述:</div>
                      <div className="flex flex-col gap-1.5">
                        {splitDescription(proj.description).map((line, i) => (
                          <div key={i} className="flex gap-2 items-start text-[13px] leading-6 text-text-main/75">
                            <span className="text-text-sub/20 mt-[2px] shrink-0">•</span>
                            <span>{line}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {proj.achievements && (
                    <div className="px-6 pb-4">
                      <div className="text-[12px] text-text-sub/40 font-medium mb-2.5">项目业绩:</div>
                      <div className="flex flex-col gap-1.5">
                        {splitDescription(proj.achievements).map((line, i) => (
                          <div key={i} className="flex gap-2 items-start text-[13px] leading-6 text-text-main/75">
                            <span className="text-text-sub/20 mt-[2px] shrink-0">•</span>
                            <span>{line}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 5. 教育经历 ── */}
      <section>
        <SectionHeader title="教育经历" />
        {eduList.length === 0 ? (
          <div className="bg-bg-elevated/20 border border-border-subtle rounded-xl p-6 text-center text-text-sub/30 text-[12px]">
            暂无教育经历数据
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {eduList.map((edu, idx) => (
              <div key={idx} className="border border-border-subtle rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 bg-bg-elevated/20">
                  <div className="flex items-center gap-3">
                    <span className="text-[15px] font-bold text-text-main">{edu.school || '--'}</span>
                    <span className="text-text-sub/20">·</span>
                    <span className="text-[13px] text-text-main/80">{edu.degreeLevel || edu.degree || '--'}</span>
                    <span className="text-text-sub/20">·</span>
                    <span className="text-[13px] text-text-main/60">{edu.major || '--'}</span>
                  </div>
                  <span className="text-[12px] text-text-sub/50 font-mono">{edu.duration || '--'}</span>
                </div>
                {edu.activities && (
                  <div className="px-6 py-3 border-t border-border-subtle text-[13px] text-text-main/75 leading-6">
                    在校经历: {edu.activities}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 6. 专业技能 ── */}
      <section>
        <SectionHeader title="专业技能" />
        {skills.length === 0 ? (
          <div className="bg-bg-elevated/20 border border-border-subtle rounded-xl p-6 text-center text-text-sub/30 text-[12px]">
            暂无技能数据
          </div>
        ) : (
          <div className="bg-bg-elevated/20 border border-border-subtle rounded-xl p-5 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Tag
                key={skill}
                className="m-0 bg-brand-primary/10 border-none text-brand-primary px-3 py-1 rounded-md text-[12px] font-medium"
              >
                {skill}
              </Tag>
            ))}
          </div>
        )}
      </section>

      {/* ── 7. 自我评价 ── */}
      {candidate.selfEvaluation && (
        <section>
          <SectionHeader title="自我评价" />
          <div className="bg-bg-elevated/20 border border-border-subtle rounded-xl p-6">
            <p className="text-[13px] leading-7 text-text-main/75 m-0 whitespace-pre-wrap">
              {candidate.selfEvaluation}
            </p>
          </div>
        </section>
      )}

      {/* Footer */}
      <div className="pt-6 border-t border-border-subtle text-center">
        <p className="text-[10px] tracking-[0.5em] text-text-sub/10 m-0">
          END OF STANDARD RESUME
        </p>
      </div>
    </div>
  );
};

export default StandardResumeContent;
