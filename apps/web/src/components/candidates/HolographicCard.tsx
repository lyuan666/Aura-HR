'use client';

import React from 'react';
import { Avatar, Tag, Badge, Button, Tooltip, Checkbox, Divider } from 'antd';
import { 
  StarOutlined, 
  ReadOutlined, 
  PhoneOutlined, 
  MessageOutlined 
} from '@ant-design/icons';
import { cn } from '@/lib/utils';

interface HolographicCardProps {
  candidate: any;
  onClick: () => void;
}

/**
 * 高密度全息人才卡片 (V2 Stable)
 * 复刻图二风格，支持垂直 3 段履历时间线
 */
export const HolographicCard = ({ candidate, onClick }: HolographicCardProps) => {
  // 提取展示用的工作经历（最多3条）
  const experiences = candidate.workExperiences?.slice(0, 3) || [];
  
  // 教育信息
  const education = candidate.educationHistory?.[0] || { 
    school: candidate.school || '-', 
    degree: candidate.education || '-', 
    major: candidate.major || '-' 
  };

  return (
    <div 
      className="group relative bg-white border-b border-slate-50 hover:bg-slate-50/80 transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start px-5 py-3.2">
        {/* 1. 最左侧：选择与头像 */}
        <div className="flex items-center space-x-4 shrink-0 mt-1">
          <Checkbox className="mr-1" onClick={(e) => e.stopPropagation()} />
          <div className="relative">
            <Avatar 
              src={candidate.avatar || (candidate.gender === '女' ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' : 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix')} 
              size={56} 
              className="border-2 border-white shadow-sm ring-1 ring-slate-100" 
            />
            {candidate.gender && (
              <div className={cn(
                "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white shadow-sm",
                candidate.gender === '女' ? 'bg-rose-400' : 'bg-blue-400'
              )}>
                 {candidate.gender === '女' ? '♀' : '♂'}
              </div>
            )}
          </div>
        </div>

        {/* 2. 基础画像区 */}
        <div className="w-[180px] shrink-0 ml-4">
          <div className="flex items-center mb-1">
            <span className="text-[15px] font-black text-slate-800 mr-2 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
              {candidate.name}
            </span>
            <StarOutlined className="text-slate-200 hover:text-amber-400 transition-colors" />
          </div>
          <div className="text-xs text-slate-400 font-bold mb-3 flex items-center">
            {candidate.age}岁 <Divider type="vertical" /> {candidate.experienceYears || 0}年经验
          </div>
          <div className="flex flex-wrap gap-1">
            {candidate.tags?.slice(0, 2).map((tag: string) => (
              <Tag key={tag} className="m-0 border-none bg-slate-100 text-slate-500 text-[9px] px-1.5 rounded-[4px] font-bold">
                {tag}
              </Tag>
            ))}
          </div>
        </div>

        {/* 3. 中间历程区：Timeline 样式 (复刻图二核心) */}
        <div className="flex-1 px-8 border-l border-slate-50 ml-6 flex flex-col justify-center">
           {experiences.length > 0 ? (
             <div className="space-y-1.5">
               {experiences.map((exp: any, idx: number) => (
                 <div key={idx} className="flex items-center text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2 shrink-0" />
                    <span className="text-slate-400 font-mono mr-2 shrink-0">{exp.period || '-'}</span>
                    <span className="font-bold text-slate-700 mr-2 truncate">{exp.company}</span>
                    <span className="text-slate-500 truncate">{exp.position}</span>
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-xs text-slate-300 italic py-2">暂无详细工作经历</div>
           )}

           {/* 教育背景：紧随履历下方 */}
           <div className="mt-2 pl-1 flex items-center text-[11px] text-slate-400 font-medium">
             <ReadOutlined className="mr-2 text-slate-300" />
             <span className="truncate">{education.school} · {education.major || '-'} · {education.degree}</span>
           </div>
        </div>

        {/* 4. 右侧操作与状态 */}
        <div className="w-[180px] flex flex-col items-end shrink-0 ml-4 space-y-4">
           <Badge 
              status={candidate.status === '进行中' ? 'processing' : 'default'} 
              text={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{candidate.status || 'NEW'}</span>}
              className="bg-slate-50 px-3 py-1 rounded-lg border border-slate-100"
           />
           <div className="flex space-x-2">
              <Tooltip title="电话沟通">
                <Button size="small" type="text" className="rounded-lg hover:bg-white hover:shadow-sm" icon={<PhoneOutlined className="text-slate-300" />} />
              </Tooltip>
              <Tooltip title="添加备注">
                <Button size="small" type="text" className="rounded-lg hover:bg-white hover:shadow-sm" icon={<MessageOutlined className="text-slate-300" />} />
              </Tooltip>
              <Button type="primary" size="small" className="text-[10px] h-7 rounded-lg bg-slate-900 border-none px-4 shadow-sm font-black">备注</Button>
           </div>
           <div className="text-[9px] text-slate-300 font-mono uppercase">Update: {candidate.lastUpdate || '-'}</div>
        </div>
      </div>
    </div>
  );
};
