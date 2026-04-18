'use client';

import React, { useState } from 'react';
import { Select, Steps, Tag, Button, Space, Card, Typography, Tooltip, Divider } from 'antd';
import { 
  CheckCircleOutlined, 
  SyncOutlined, 
  CloseCircleOutlined,
  SwapOutlined,
  SendOutlined,
  CalendarOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface Job {
  id: string;
  title: string;
  company: string;
  status: string;
}

interface ProcessControlPanelProps {
  candidateId: string;
  currentJobId?: string;
}

const mockJobs: Job[] = [
  { id: 'job-1', title: '高级后端工程师', company: '字节跳动', status: '面试中' },
  { id: 'job-2', title: '架构师', company: '腾讯', status: '待筛选' },
  { id: 'job-3', title: '技术经理', company: '阿里巴巴', status: '已淘汰' },
];

const ProcessControlPanel: React.FC<ProcessControlPanelProps> = ({ candidateId, currentJobId }) => {
  const [selectedJobId, setSelectedJobId] = useState(currentJobId || mockJobs[0].id);
  
  const currentJob = mockJobs.find(j => j.id === selectedJobId) || mockJobs[0];

  const steps = [
    { title: '简历投递', status: 'finish', description: '2023-11-01' },
    { title: '初面', status: 'finish', description: '2023-11-05' },
    { title: '复面', status: 'process', description: '进行中' },
    { title: '终面', status: 'wait' },
    { title: '发放Offer', status: 'wait' },
    { title: '入职', status: 'wait' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#fcfdfe] border-l border-gray-100 p-6 w-[340px] shrink-0">
      <div className="mb-6">
        <Title level={5} className="text-gray-400 font-medium mb-3 text-[12px] uppercase tracking-wider">招聘控制台</Title>
        <Select 
          value={selectedJobId} 
          onChange={setSelectedJobId}
          className="w-full custom-select rounded-xl"
          suffixIcon={<SwapOutlined />}
        >
          {mockJobs.map(job => (
            <Select.Option key={job.id} value={job.id}>
              <div className="flex flex-col py-1">
                <Text strong className="text-sm">{job.title}</Text>
                <Text type="secondary" className="text-[11px]">{job.company}</Text>
              </div>
            </Select.Option>
          ))}
        </Select>
      </div>

      <Card size="small" className="rounded-xl border-none shadow-sm mb-6 bg-white overflow-hidden">
        <div className="p-2">
          <div className="flex justify-between items-center mb-6">
            <Tag color={currentJob.status === '已淘汰' ? 'default' : 'blue'} bordered={false} className="rounded-full px-3 m-0">
              {currentJob.status}
            </Tag>
            <Text type="secondary" className="text-[11px]">
              <CalendarOutlined className="mr-1" /> 2小时前更新
            </Text>
          </div>
          
          <Steps
            direction="vertical"
            size="small"
            current={2}
            items={steps.map(s => ({
              title: <span className="text-[13px] font-medium">{s.title}</span>,
              description: s.description && <span className="text-[11px] text-gray-400">{s.description}</span>,
              status: s.status as any
            }))}
          />
        </div>
      </Card>

      <div className="mt-auto space-y-3">
        <Text className="text-gray-400 text-xs px-1">流程操作</Text>
        <Button block type="primary" size="large" icon={<CheckCircleOutlined />} className="bg-blue-600 hover:bg-blue-500 border-none rounded-xl h-11 text-sm font-medium">
          通过当前阶段
        </Button>
        <Button block size="large" icon={<CalendarOutlined />} className="rounded-xl h-11 text-gray-700 hover:border-blue-400 hover:text-blue-500 text-sm font-medium">
          安排面试
        </Button>
        <Button block danger size="large" icon={<CloseCircleOutlined />} className="rounded-xl h-11 border-none bg-red-50 text-red-500 hover:bg-red-100 text-sm font-medium">
          淘汰此人
        </Button>
        
        <Divider className="my-2" />
        
        <Button block size="large" icon={<SendOutlined />} className="rounded-xl h-11 border-blue-100 text-blue-600 hover:bg-blue-50 text-sm font-medium">
          推荐给新职位
        </Button>
      </div>
    </div>
  );
};

export default ProcessControlPanel;
