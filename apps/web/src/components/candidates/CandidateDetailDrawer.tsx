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
          标准简历
        </Space>
      ),
      children: <StandardResumeContent candidate={candidate} />,
    },
    {
      key: 'attachment',
      label: (
        <Space size={4}>
          <PaperClipOutlined />
          附件简历
        </Space>
      ),
      children: (
        <div className="flex flex-col items-center justify-center p-20 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200 m-8">
           <PaperClipOutlined className="text-5xl text-gray-300 mb-6" />
           <p className="text-gray-400 text-base mb-6">暂无原始附件简历，建议上传以保留排版样式</p>
           <Button type="primary" size="large" className="rounded-xl px-10 h-11 bg-blue-600 border-none shadow-lg shadow-blue-100">立即上传</Button>
        </div>
      ),
    },
    {
      key: 'records',
      label: (
        <Space size={4}>
          <HistoryOutlined />
          流转动态
        </Space>
      ),
      children: (
        <div className="p-8">
          <Steps
            direction="vertical"
            size="small"
            current={1}
            items={[
              {
                title: '通过简历初筛',
                description: '操作人：系统管理员',
                subTitle: '2023-11-20 14:30',
              },
              {
                title: '推荐给：字节跳动 - 高级 Java 工程师',
                description: '状态：已推入',
                subTitle: '2023-11-21 10:00',
              },
              {
                title: '客户面试',
                description: '待安排面试时间',
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
        body: { padding: 0, overflow: 'hidden' }
      }}
      className="candidate-drawer"
    >
      <div className="flex h-full bg-white">
        {/* 左侧：简历主体内容 */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col border-r border-gray-100">
          {/* 悬浮页眉块 */}
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-10 py-6 border-b border-gray-100/50 flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <Avatar src={candidate.avatar} size={64} className="border-4 border-white shadow-lg ring-1 ring-gray-100" />
              <div>
                <div className="flex items-center mb-1">
                  <h2 className="text-xl font-bold text-gray-900 m-0 mr-3">{candidate.name}</h2>
                  <Tooltip title="设为星标">
                    <StarOutlined className="text-lg text-gray-300 hover:text-yellow-400 cursor-pointer transition-colors" />
                  </Tooltip>
                </div>
                <div className="flex items-center space-x-3 text-gray-400 text-xs font-medium">
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{candidate.gender}</span>
                  <span>{candidate.age}岁 · {candidate.education} · {candidate.experienceYears}年经验</span>
                  <Divider type="vertical" />
                  <span className="flex items-center"><PhoneOutlined className="mr-1" /> {candidate.phone}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
               <Button icon={<ShareAltOutlined />} className="rounded-lg border-gray-200 text-gray-600 h-9 font-medium">分享</Button>
               <Button icon={<DownloadOutlined />} className="rounded-lg border-gray-200 text-gray-600 h-9 font-medium">导出</Button>
               <Button shape="circle" icon={<CloseOutlined />} onClick={onClose} className="border-none bg-gray-50 hover:bg-red-50 hover:text-red-500 transition-all ml-4" />
            </div>
          </div>

          {/* 简历内容区域 */}
          <div className="flex-1">
            <div className="px-10 py-2 border-b border-gray-50 flex space-x-8 bg-gray-50/30">
              {tabItems.map(item => (
                <div 
                  key={item.key} 
                  onClick={() => setActiveTab(item.key)}
                  className={cn(
                    "py-3 px-1 text-sm font-bold cursor-pointer transition-all border-b-2",
                    activeTab === item.key ? "text-blue-600 border-blue-600" : "text-gray-400 border-transparent hover:text-gray-600"
                  )}
                >
                  {item.label}
                </div>
              ))}
            </div>
            <div className="p-0">
               {tabItems.find(t => t.key === activeTab)?.children}
            </div>
          </div>
        </div>

        {/* 右侧：跟进信息与流程控制 */}
        <div className="w-[360px] bg-slate-50 overflow-y-auto no-scrollbar flex flex-col pt-8">
          <div className="px-8 mb-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-gray-700 m-0 uppercase tracking-wider">跟进看板</h3>
              <Badge status="processing" text={<Text className="text-[11px] font-bold text-blue-500">流程中</Text>} />
            </div>
            
            {/* AI 评估卡片 */}
            <div className="bg-blue-600 rounded-2xl p-5 mb-8 shadow-xl shadow-blue-100 relative overflow-hidden">
               <ThunderboltOutlined className="absolute right-[-10px] top-[-10px] text-6xl text-white/10 rotate-12" />
               <div className="relative z-1">
                  <div className="text-blue-100 text-[10px] uppercase font-bold mb-2 tracking-widest">AI Matching Score</div>
                  <div className="text-3xl font-black text-white mb-2">92<span className="text-sm ml-1 opacity-70">/100</span></div>
                  <Paragraph className="text-blue-100 text-[11px] mb-4 opacity-80 leading-relaxed font-medium">
                    核心技能高度匹配。该候选人在分布式架构方面有深厚积累，非常适合目前的后端专家岗。
                  </Paragraph>
                  <Button ghost size="small" className="rounded-lg text-[10px] h-7 border-blue-400 text-white">查看 AI 报告</Button>
               </div>
            </div>

            {/* 流程进度 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
              <div className="text-[11px] font-bold text-gray-400 mb-6 flex justify-between items-center group cursor-pointer">
                <span>面试环节进度</span>
                <EditOutlined className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <Steps
                direction="vertical"
                current={1}
                size="small"
                className="custom-steps"
                items={[
                  { title: <span className="text-xs font-bold">简历初筛</span>, status: 'finish' },
                  { title: <span className="text-xs font-bold">推荐至客户部</span>, status: 'process' },
                  { title: <span className="text-xs font-bold text-gray-300">技术首面</span>, status: 'wait' },
                  { title: <span className="text-xs font-bold text-gray-300">终面入职</span>, status: 'wait' },
                ]}
              />
            </div>

            {/* 跟进纪要 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
               <div className="text-[11px] font-bold text-gray-400 mb-4 flex items-center">
                 <SafetyCertificateOutlined className="mr-2 text-blue-500" /> 跟进记录
               </div>
               <Input.TextArea 
                  placeholder="在此输入跟进内容或反馈点评..." 
                  rows={4} 
                  className="rounded-xl border-gray-100 bg-gray-50/50 focus:border-blue-200 text-xs mb-4"
               />
               <div className="flex justify-between items-center">
                 <Button type="text" className="text-[11px] text-gray-400 hover:text-blue-500 px-0">模板</Button>
                 <Button type="primary" shape="round" icon={<SendOutlined />} className="h-8 bg-blue-600 border-none px-4 shadow-md shadow-blue-100" />
               </div>
            </div>
          </div>

          <div className="mt-auto p-8 border-t border-gray-100 bg-white">
             <Button type="primary" block className="h-11 rounded-xl bg-blue-600 border-none font-bold shadow-lg shadow-blue-100 mb-3">
               推进到下一流程
             </Button>
             <Space className="w-full">
               <Button block className="h-10 rounded-xl border-gray-100 text-gray-500 hover:border-red-200 hover:text-red-500">淘汰</Button>
               <Button block className="h-10 rounded-xl border-gray-100 text-gray-500">移入公海</Button>
             </Space>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default CandidateDetailDrawer;
