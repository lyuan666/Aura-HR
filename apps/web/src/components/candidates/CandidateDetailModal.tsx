'use client';

import React, { useState } from 'react';
import { Modal, Tabs, Button, Space, Typography, Tag, Avatar, Divider, Steps, Input } from 'antd';
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
  SendOutlined
} from '@ant-design/icons';
import StandardResumeContent from './StandardResumeContent';

const { Title, Text, Paragraph } = Typography;

interface CandidateDetailModalProps {
  visible: boolean;
  candidate: any;
  onClose: () => void;
}

const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({ visible, candidate, onClose }) => {
  const [activeTab, setActiveTab] = useState('standard');

  if (!candidate) return null;

  const tabItems = [
    {
      key: 'standard',
      label: (
        <Space>
          <FileTextOutlined />
          标准简历
        </Space>
      ),
      children: <StandardResumeContent candidate={candidate} />,
    },
    {
      key: 'attachment',
      label: (
        <Space>
          <PaperClipOutlined />
          附件简历
        </Space>
      ),
      children: (
        <div className="flex flex-col items-center justify-center p-20 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200 m-8">
           <PaperClipOutlined className="text-5xl text-gray-300 mb-6" />
           <p className="text-gray-400 text-base mb-6">暂无原始附件简历，建议上传以保留排版样式</p>
           <Button type="primary" size="large" className="rounded-xl px-10 h-12 bg-blue-600 shadow-lg shadow-blue-100">立即上传</Button>
        </div>
      ),
    },
    {
      key: 'records',
      label: (
        <Space>
          <HistoryOutlined />
          流转记录
        </Space>
      ),
      children: (
        <div className="p-8">
          <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 mb-8 flex items-start space-x-4">
            <Avatar className="bg-blue-100 text-blue-600" icon={<StarOutlined />} />
            <div>
              <Text className="font-bold block mb-1">通过简历初筛</Text>
              <Text type="secondary" className="text-xs">操作人：系统管理员 · 2023-11-20 14:30</Text>
            </div>
          </div>
          <Paragraph className="text-gray-400 text-center py-20">更多记录正在实时同步中...</Paragraph>
        </div>
      ),
    },
  ];

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1300}
      centered
      className="candidate-detail-modal"
      styles={{ 
        body: { padding: 0, overflow: 'hidden', height: '85vh' },
        mask: { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.45)' }
      }}
      closeIcon={<div className="bg-gray-100 hover:bg-gray-200 transition-colors rounded-full p-1.5 flex items-center justify-center"><MoreOutlined className="text-gray-600" rotate={90} /></div>}
    >
      <div className="flex h-full">
        {/* 左侧主内容区 */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-white flex flex-col">
          {/* 模态框顶部信息卡片 */}
          <div className="px-10 py-8 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 shrink-0">
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-6">
                <Avatar src={candidate.avatar} size={72} className="border-4 border-white shadow-xl shadow-gray-200/50 shrink-0" />
                <div>
                  <div className="flex items-center mb-2">
                    <h2 className="text-2xl font-black text-gray-900 m-0 mr-3">{candidate.name}</h2>
                    <StarOutlined className="text-xl text-yellow-400 cursor-pointer hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex items-center space-x-4 text-gray-400 text-sm mb-4">
                    <span>{candidate.gender} · {candidate.age}岁 · {candidate.education}</span>
                    <Divider type="vertical" className="bg-gray-200" />
                    <span className="flex items-center"><PhoneOutlined className="mr-1" /> {candidate.phone}</span>
                    <Divider type="vertical" className="bg-gray-200" />
                    <span className="flex items-center"><MailOutlined className="mr-1" /> {candidate.email}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {candidate.tags?.map((tag: string) => (
                      <Tag key={tag} className="m-0 border-none bg-blue-50 text-blue-600 text-[11px] px-3 py-0.5 rounded-full font-medium">
                        {tag}
                      </Tag>
                    ))}
                    <Tag className="m-0 border-dashed border-gray-300 bg-transparent text-gray-400 text-[11px] px-3 py-0.5 rounded-full cursor-pointer hover:border-blue-300 hover:text-blue-400 transition-colors">
                      + 添加标签
                    </Tag>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-4">
                <Space size={12}>
                  <Button icon={<ShareAltOutlined />} className="rounded-xl border-gray-200 text-gray-600 h-10 hover:text-blue-600 hover:border-blue-600">分享简历</Button>
                  <Button icon={<DownloadOutlined />} className="rounded-xl border-gray-200 text-gray-600 h-10">下载 PDF</Button>
                </Space>
                <Text type="secondary" className="text-[10px] uppercase tracking-widest bg-gray-100 px-2 py-1 rounded">Resume ID: {candidate.id || '9256202'}</Text>
              </div>
            </div>
          </div>

          {/* Tab 导航区 */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              items={tabItems} 
              className="detail-tabs h-full"
              tabBarStyle={{ paddingLeft: '40px', background: '#fff', marginBottom: 0, borderBottom: '1px solid #f8fafc' }}
            />
          </div>
        </div>

        {/* 右侧流程控制区 - 专业猎头视角 */}
        <div className="w-[380px] bg-gray-50 border-l border-gray-100 overflow-y-auto no-scrollbar p-8 flex flex-col shrink-0">
          <div className="mb-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800 m-0">当前流程</h3>
              <Tag color="green" className="m-0 rounded-full px-3 text-[11px] border-none font-bold">在招中</Tag>
            </div>
            
            <Steps
              direction="vertical"
              current={1}
              size="small"
              className="process-steps"
              items={[
                { title: '简历初筛', description: '2023-11-20' },
                { title: '推荐给客户', description: '待推入' },
                { title: '客户面试', description: '待安排' },
                { title: '录用结果', description: '待反馈' },
              ]}
            />
          </div>

          <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 flex flex-col">
            <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
              <HistoryOutlined className="mr-2 text-blue-500" /> 
              跟进操作
            </h4>
            
            <div className="flex-1">
              <Paragraph className="text-xs text-gray-400 mb-4 px-1">
                输入您的跟进纪要或面试评价，支持 @ 团队成员协作
              </Paragraph>
              <Input.TextArea 
                placeholder="在此输入跟进内容..." 
                rows={4} 
                className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all text-sm mb-4"
              />
              <div className="flex justify-between items-center mb-6 px-1">
                <Button type="text" size="small" className="text-gray-400 text-xs hover:text-blue-500">选择模板</Button>
                <Button type="primary" shape="circle" icon={<SendOutlined />} className="shadow-lg shadow-blue-100" />
              </div>
            </div>

            <Divider className="my-6 border-gray-50" />

            <div className="grid grid-cols-2 gap-4">
              <Button 
                type="primary" 
                block 
                className="h-12 rounded-xl bg-blue-600 shadow-xl shadow-blue-100 font-bold"
              >
                推进到下一阶段
              </Button>
              <Button 
                danger 
                block 
                className="h-12 rounded-xl font-bold border-red-100 hover:bg-red-50"
              >
                淘汰候选人
              </Button>
            </div>
            <Button block className="mt-4 h-10 rounded-xl text-gray-500 border-gray-200">加入其他职位</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CandidateDetailModal;
