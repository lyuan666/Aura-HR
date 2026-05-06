'use client';

import React from 'react';
import { Tag, Empty } from 'antd';
import { EditOutlined, SolutionOutlined } from '@ant-design/icons';
import { cn } from '@/lib/utils';

interface WorkExperience {
  companyName?: string;
  company?: string;
  position?: string;
  duration?: string;
  content?: string | string[];
  description?: string;
}

interface EducationExperience {
  school?: string;
  degree?: string;
  degreeLevel?: string;
  major?: string;
  duration?: string;
}

interface ProjectExperience {
  projectName?: string;
  role?: string;
  duration?: string;
  description?: string;
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
  workExperiences?: WorkExperience[];
  educationHistory?: EducationExperience[];
  projectExperiences?: ProjectExperience[];
  parsedTags?: {
    skills?: string[];
  };
}

interface CandidateProps {
  candidate: CandidateProfile | null;
}

const SectionHeader = ({ title, showEdit = true }: { title: string; showEdit?: boolean }) => (
  <div className="flex items-center justify-between mb-6 group/header">
    <div className="flex items-center gap-3">
      <div className="w-1 h-5 bg-brand-primary rounded-sm" />
      <h3 className="text-[15px] font-bold text-text-main m-0 tracking-wide">{title}</h3>
    </div>
    {showEdit && (
      <button className="flex items-center gap-1.5 text-[12px] text-text-sub/40 hover:text-brand-light transition-colors bg-white/5 px-2.5 py-1 rounded-md opacity-0 group-hover/header:opacity-100">
        <EditOutlined /> 修改信息
      </button>
    )}
  </div>
);

const InfoItem = ({
  label,
  value,
  className = '',
}: {
  label: string;
  value: string | number | React.ReactNode;
  className?: string;
}) => (
  <div className={cn('flex flex-col gap-1.5', className)}>
    <span className="text-[12px] text-text-sub/50 font-medium">{label}</span>
    <span className="text-[13px] text-text-main font-bold tracking-tight">{value || '--'}</span>
  </div>
);

const StandardResumeContent: React.FC<CandidateProps> = ({ candidate }) => {
  if (!candidate) {
    return (
      <div className="py-32 flex flex-col items-center justify-center">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span className="text-white/30 text-[12px]">暂无简历数据</span>}
        />
      </div>
    );
  }

  const workExp = candidate.workExperiences || [];
  const eduList = candidate.educationHistory || [];
  const projList = candidate.projectExperiences || [];
  const skills = Array.isArray(candidate.parsedTags?.skills) ? candidate.parsedTags.skills : [];
  const genderText =
    candidate.gender === 'female' ? '女' : candidate.gender === 'male' ? '男' : '--';

  return (
    <div className="p-10 flex flex-col gap-12 bg-bg-base text-text-main">
      <section>
        <SectionHeader title="基本信息" />
        <div className="grid grid-cols-4 gap-y-8 bg-bg-elevated/20 border border-border-subtle p-8 rounded-2xl">
          <InfoItem label="姓名" value={candidate.name} />
          <InfoItem label="性别" value={genderText} />
          <InfoItem label="年龄" value={candidate.age ? `${candidate.age}岁` : '--'} />
          <InfoItem
            label="工作年限"
            value={candidate.totalYears ? `${candidate.totalYears}年` : '--'}
          />
          <InfoItem label="手机号码" value={candidate.phone} />
          <InfoItem label="电子邮箱" value={candidate.email} />
          <InfoItem label="所在城市" value={candidate.location} />
          <InfoItem label="最高学历" value={candidate.degree} />
        </div>
      </section>

      <section>
        <SectionHeader title="工作经历" />
        {workExp.length === 0 ? (
          <div className="bg-bg-elevated/20 border border-border-subtle p-8 rounded-2xl text-center">
            <span className="text-text-sub/30 text-[12px]">暂无工作经历数据</span>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {workExp.map((exp, index) => {
              const contentArray = Array.isArray(exp.content)
                ? exp.content
                : typeof exp.description === 'string'
                  ? [exp.description]
                  : typeof exp.content === 'string'
                    ? [exp.content]
                    : [];

              return (
                <div key={index} className="relative pl-8 border-l border-border-subtle group/item">
                  <div className="absolute left-[-5px] top-1.5 w-[9px] h-[9px] rounded-full bg-bg-elevated border-2 border-brand-primary group-hover/item:scale-110 transition-transform" />

                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-[16px] font-bold text-text-main hover:text-brand-primary hover:underline cursor-pointer transition-all">
                        {exp.companyName || exp.company || '--'}
                      </span>
                      <span className="opacity-20 text-text-sub">|</span>
                      <span className="text-[14px] font-medium text-text-main/80">
                        {exp.position || '--'}
                      </span>
                    </div>
                    <span className="text-[12px] font-medium text-text-sub/50 font-mono">
                      {exp.duration || '--'}
                    </span>
                  </div>

                  {contentArray.length > 0 && (
                    <div className="flex flex-col gap-2.5 px-1">
                      <span className="text-[12px] text-text-sub/50 font-bold uppercase tracking-widest flex items-center gap-2">
                        <SolutionOutlined className="text-brand-primary" /> 工作内容
                      </span>
                      {contentArray.map((item, i) => (
                        <div
                          key={i}
                          className="flex gap-2.5 items-start text-[13px] leading-relaxed text-text-main/70"
                        >
                          <span className="text-brand-primary mt-1.5 w-1 h-1 rounded-full shrink-0" />
                          <p className="m-0">{item}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="教育经历" />
        {eduList.length === 0 ? (
          <div className="bg-bg-elevated/20 border border-border-subtle p-8 rounded-2xl text-center">
            <span className="text-text-sub/30 text-[12px]">暂无教育经历数据</span>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {eduList.map((edu, index) => (
              <div key={index} className="relative pl-8 border-l border-border-subtle group/item">
                <div className="absolute left-[-5px] top-1.5 w-[9px] h-[9px] rounded-full bg-bg-elevated border-2 border-brand-primary group-hover/item:scale-110 transition-transform" />
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3 text-[15px] font-medium">
                    <span className="text-text-main hover:text-brand-primary cursor-pointer transition-colors">
                      {edu.school || '--'}
                    </span>
                    <span className="opacity-20">·</span>
                    <span className="text-text-main/80">
                      {edu.degreeLevel || edu.degree || '--'}
                    </span>
                    <span className="opacity-20">·</span>
                    <span className="text-text-main/60">{edu.major || '--'}</span>
                  </div>
                  <span className="text-[12px] font-medium text-text-sub/50 font-mono">
                    {edu.duration || '--'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-10">
        <section>
          <SectionHeader title="专业技能" />
          {skills.length === 0 ? (
            <div className="bg-bg-elevated/20 border border-border-subtle p-6 rounded-2xl text-center">
              <span className="text-text-sub/30 text-[12px]">暂无技能数据</span>
            </div>
          ) : (
            <div className="bg-bg-elevated/20 border border-border-subtle p-6 rounded-lg flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Tag
                  key={skill}
                  className="m-0 bg-brand-primary/10 border-none text-brand-primary px-3 py-1 rounded-md text-[12px] font-bold hover:bg-brand-primary/20 transition-all cursor-default"
                >
                  {skill}
                </Tag>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeader title="项目经历" />
          {projList.length === 0 ? (
            <div className="bg-bg-elevated/20 border border-border-subtle p-6 rounded-2xl text-center">
              <span className="text-text-sub/30 text-[12px]">暂无项目经历数据</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {projList.map((proj, i) => (
                <div
                  key={i}
                  className="bg-bg-elevated/20 border border-border-subtle p-5 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[14px] font-bold text-text-main">
                      {proj.projectName || '--'}
                    </span>
                    {proj.role && (
                      <span className="text-[12px] text-brand-primary">{proj.role}</span>
                    )}
                  </div>
                  {proj.duration && (
                    <span className="text-[11px] text-text-sub/40 font-mono">{proj.duration}</span>
                  )}
                  {proj.description && (
                    <p className="text-[12px] text-text-sub/80 mt-2 m-0 leading-relaxed">
                      {proj.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="mt-12 text-center border-t border-border-subtle pt-12">
        <p className="text-[10px] font-black uppercase tracking-[0.8em] text-text-sub/10">
          End of Standard Structured Profile
        </p>
      </div>
    </div>
  );
};

export default StandardResumeContent;
