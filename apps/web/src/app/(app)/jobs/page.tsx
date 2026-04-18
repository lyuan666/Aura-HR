'use client';

import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Input, 
  Space, 
  Tag,
  Card, 
  Typography, 
  Row, 
  Col, 
  Tabs, 
  Statistic, 
  Empty,
  Badge,
  App
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  RadarChartOutlined, 
  FileTextOutlined,
  FireOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RobotOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import SmartJobCreationModal from '@/components/jobs/SmartJobCreationModal';
import { cn } from '@/lib/utils';

const { Title, Text, Paragraph } = Typography;

interface JobPosition {
  id: string;
  title: string;
  description: string;
  status: string;
  salaryMin?: number;
  salaryMax?: number;
  skillTags?: string[];
  createdAt: string;
  candidateCount?: number;
}

export default function JobsPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [data, setData] = useState<JobPosition[]>([]);
  const router = useRouter();

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/job-positions');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('获取职位列表失败:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredData = data.filter(item => {
    if (activeTab === 'all') return true;
    return item.status === activeTab;
  });

  return (
    <div className="p-8 bg-[#f8fafc] min-h-full">
      {/* 顶部标题区域 */}
      <div className="mb-10 flex justify-between items-end">
        <div>
          <div className="flex items-center mb-1">
             <div className="w-2 h-8 bg-blue-600 rounded-full mr-3 shadow-[0_0_12px_rgba(37,99,235,0.4)]" />
             <h1 className="text-3xl font-black text-gray-900 m-0 tracking-tighter italic">职位管理中心</h1>
          </div>
          <Text className="text-gray-400 ml-5">Smart AI-Driven Job Management & Vector Matching System</Text>
        </div>
        <Space size="middle">
          <Input 
            prefix={<SearchOutlined className="text-gray-400" />} 
            placeholder="搜索职位标题、技能关键词..." 
            className="w-72 h-11 rounded-1.5xl border-none shadow-sm hover:shadow-md transition-all"
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            size="large"
            onClick={() => setIsModalVisible(true)}
            className="h-11 px-8 rounded-1.5xl bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-100 border-none font-bold"
          >
            发布新职位
          </Button>
        </Space>
      </div>

      {/* 快速统计卡片 - 玻璃拟态设计 */}
      <Row gutter={24} className="mb-10">
        <Col span={6}>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:scale-[1.02] transition-transform duration-300">
            <Statistic 
              title={<span className="text-gray-400 text-xs font-bold uppercase tracking-wider">招募中职位</span>}
              value={12} 
              prefix={<FireOutlined className="text-orange-500 mr-2" />}
              valueStyle={{ color: '#1f2937', fontWeight: 900, fontSize: '28px' }}
            />
          </div>
        </Col>
        <Col span={6}>
           <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:scale-[1.02] transition-transform duration-300">
            <Statistic 
              title={<span className="text-gray-400 text-xs font-bold uppercase tracking-wider">今日新增面试</span>}
              value={48} 
              prefix={<CheckCircleOutlined className="text-green-500 mr-2" />}
              valueStyle={{ color: '#1f2937', fontWeight: 900, fontSize: '28px' }}
            />
          </div>
        </Col>
        <Col span={6}>
           <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:scale-[1.02] transition-transform duration-300">
            <Statistic 
              title={<span className="text-gray-400 text-xs font-bold uppercase tracking-wider">平均入职周期</span>}
              value={14.2} 
              precision={1}
              suffix={<span className="text-xs ml-1 text-gray-400">Days</span>}
              prefix={<ClockCircleOutlined className="text-blue-500 mr-2" />}
              valueStyle={{ color: '#1f2937', fontWeight: 900, fontSize: '28px' }}
            />
          </div>
        </Col>
        <Col span={6}>
          <div className="bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl p-6 shadow-xl shadow-blue-100 relative overflow-hidden group">
            <RadarChartOutlined className="absolute right-[-10px] bottom-[-10px] text-7xl text-white opacity-10 group-hover:scale-110 transition-transform" />
            <Statistic 
              title={<span className="text-white/70 text-xs font-bold uppercase tracking-wider">AI 智能匹配率</span>}
              value={89.5} 
              precision={1}
              suffix={<span className="text-white/70 text-xs ml-1">%</span>}
              prefix={<RobotOutlined className="text-white mr-2" />}
              valueStyle={{ color: '#fff', fontWeight: 900, fontSize: '28px' }}
            />
          </div>
        </Col>
      </Row>

      {/* 职位列表 Tabs */}
      <div className="bg-white p-8 rounded-3xl shadow-sm min-h-[500px] border border-gray-50">
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          className="mb-8 custom-tabs-large"
          items={[
            { key: 'all', label: `全部职位 (${data.length})` },
            { key: 'active', label: `招募中 (${data.filter(i => i.status === 'active').length})` },
            { key: 'closed', label: `已停招 (${data.filter(i => i.status === 'closed').length})` },
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredData.map(job => (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Card 
                  className="rounded-2xl border-gray-100 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-50/50 transition-all cursor-pointer group h-full relative overflow-hidden"
                  styles={{ body: { padding: '24px' } }}
                  onClick={() => router.push(`/jobs/${job.id}`)}
                >
                  <div className="flex justify-between items-start mb-6">
                    <Tag className="rounded-lg border-none px-3 py-0.5 bg-gray-100 text-gray-500 m-0 font-mono text-[10px]">
                      #{job.id.padStart(4, '0')}
                    </Tag>
                    <Badge 
                      status={job.status === 'active' ? 'processing' : 'default'} 
                      text={<span className={cn("text-xs font-bold", job.status === 'active' ? "text-blue-600" : "text-gray-400")}>
                        {job.status === 'active' ? '招募中' : '已关闭'}
                      </span>} 
                    />
                  </div>
                  
                  <h3 className="text-lg font-black text-gray-900 mt-0 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                    {job.title}
                  </h3>
                  
                  <div className="text-xl font-black text-orange-500 mb-6 flex items-baseline">
                    {job.salaryMin}k - {job.salaryMax}k
                    <span className="text-[10px] text-gray-400 ml-1 font-normal">/ CNY</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-8">
                    {job.skillTags?.map(tag => (
                      <Tag key={tag} className="border-none bg-blue-50/50 text-blue-600 text-[10px] px-2.5 py-0.5 rounded-md font-medium">
                        {tag}
                      </Tag>
                    ))}
                  </div>

                  <div className="pt-5 border-t border-gray-50 flex justify-between items-center text-xs text-gray-400">
                    <span className="flex items-center">
                      <FileTextOutlined className="mr-1.5" />
                      已递简历 <span className="text-gray-900 font-black mx-1">{job.candidateCount || 0}</span> 份
                    </span>
                    <Button 
                      type="link" 
                      icon={<RadarChartOutlined />} 
                      className="p-0 h-auto text-blue-600 font-bold hover:text-blue-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/jobs/${job.id}/matches`);
                      }}
                    >
                      AI 匹配
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredData.length === 0 && (
            <div className="col-span-full py-32 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
              <Empty description={<span className="text-gray-400">没有找到符合条件的职位信息</span>} />
            </div>
          )}
        </div>
      </div>

      {/* 智能发布 Modal */}
      <SmartJobCreationModal 
        visible={isModalVisible} 
        onCancel={() => setIsModalVisible(false)}
        onSuccess={(jobData) => {
          message.success('职位发布成功！');
          setIsModalVisible(false);
          fetchJobs();
        }}
      />
    </div>
  );
}
