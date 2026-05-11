'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Card, Tag, Space, Avatar, Skeleton, Empty, Button, Tabs, App } from 'antd';
import { 
  RocketOutlined, 
  UserOutlined, 
  SolutionOutlined, 
  ThunderboltOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HomeOutlined
} from '@ant-design/icons';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

export default function ClientDashboard() {
  const { message } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/client/login');
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [jobsRes, recsRes] = await Promise.all([
        api.get('/client-portal/jobs'),
        api.get('/client-portal/recommendations')
      ]);
      setJobs(jobsRes.data);
      setRecommendations(recsRes.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.post(`/client-portal/recommendations/${id}/status`, { status });
      message.success('状态已更新');
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/client/login');
  };

  const statusColors: any = {
    new: 'cyan',
    interview: 'purple',
    offer: 'orange',
    rejected: 'red',
    hired: 'green'
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0D11] pb-20">
      {/* Header */}
      <div className="px-6 py-10 bg-gradient-to-b from-[#11131A] to-transparent border-b border-white/5">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-[10px] font-black text-[#555762] uppercase tracking-[0.2em] mb-1">天选 OS · 客户门户</div>
            <Title level={2} className="!text-white !mb-0 !font-black tracking-tight italic">
              Hello, {user?.name || 'HR Client'}
            </Title>
            <Text className="text-brand-primary font-bold text-[11px] uppercase tracking-widest">{user?.enterprise || 'Partner Enterprise'}</Text>
          </div>
          <Button 
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
            className="!bg-white/5 !border-white/5 !text-[#555762] hover:!text-[#FF5252] rounded-xl"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-3xl">
            <div className="text-[10px] font-black text-[#555762] uppercase tracking-widest mb-1">进行中职位</div>
            <div className="text-2xl font-black text-white italic">{jobs.length}</div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-3xl">
            <div className="text-[10px] font-black text-[#555762] uppercase tracking-widest mb-1">待筛选人选</div>
            <div className="text-2xl font-black text-white italic">{recommendations.filter((r: any) => r.status === 'new').length}</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 mt-8">
        <Tabs
          defaultActiveKey="recs"
          items={[
            {
              key: 'recs',
              label: <span className="uppercase tracking-widest font-black text-[11px]">人选推荐</span>,
              children: (
                <div className="space-y-4">
                  {loading ? (
                    <Skeleton active />
                  ) : recommendations.length === 0 ? (
                    <Empty description="暂无人选推荐" className="py-20" />
                  ) : (
                    recommendations.map((rec: any) => (
                      <motion.div
                        key={rec.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/[0.02] border border-white/5 p-6 rounded-[32px] relative overflow-hidden group"
                      >
                        <div className="flex items-start gap-4">
                          <Avatar size={50} src={rec.candidate?.avatar} className="bg-[#6C5CE7]/20 text-[#A29BFE] font-bold">
                            {rec.candidate?.name?.[0]}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <Title level={5} className="!text-white !mb-0">{rec.candidate?.name}</Title>
                              <Tag color={statusColors[rec.status] || 'default'} className="m-0 border-none uppercase text-[9px] font-black tracking-widest rounded-full px-3">
                                {rec.status}
                              </Tag>
                            </div>
                            <Text className="text-[#555762] text-xs block mb-3">
                              {rec.candidate?.degree} · {rec.candidate?.totalYears}年经验 · {rec.job?.title}
                            </Text>
                            
                            {rec.status === 'new' && (
                              <div className="flex gap-2 mt-4">
                                <Button 
                                  type="primary" 
                                  size="small" 
                                  icon={<CheckCircleOutlined />}
                                  onClick={() => handleUpdateStatus(rec.id, 'interview')}
                                  className="flex-1 bg-[#00E676] border-none rounded-xl font-bold text-[11px]"
                                >
                                  通过初筛
                                </Button>
                                <Button 
                                  danger 
                                  size="small" 
                                  icon={<CloseCircleOutlined />}
                                  onClick={() => handleUpdateStatus(rec.id, 'rejected')}
                                  className="flex-1 bg-error/10 border-none rounded-xl font-bold text-[11px]"
                                >
                                  淘汰
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )
            },
            {
              key: 'jobs',
              label: <span className="uppercase tracking-widest font-black text-[11px]">我的职位</span>,
              children: (
                <div className="space-y-4">
                  {loading ? (
                    <Skeleton active />
                  ) : jobs.length === 0 ? (
                    <Empty description="暂无职位需求" className="py-20" />
                  ) : (
                    jobs.map((job: any) => (
                      <div key={job.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-[32px]">
                        <Title level={5} className="!text-white mb-1">{job.title}</Title>
                        <Text className="text-[#555762] text-xs block mb-3">
                          {job.location} · {job.salaryMin}K-{job.salaryMax}K
                        </Text>
                        <Space wrap>
                          {(job.skillTags || []).map((tag: string) => (
                            <Tag key={tag} className="m-0 bg-white/5 border-white/5 text-[#555762] text-[10px] rounded-md px-2 py-0.5">{tag}</Tag>
                          ))}
                        </Space>
                      </div>
                    ))
                  )}
                </div>
              )
            }
          ]}
        />
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-md bg-white/5 backdrop-blur-xl border border-white/10 h-16 rounded-[24px] flex items-center justify-around px-8 shadow-2xl z-50">
        <HomeOutlined className="text-xl text-[#6C5CE7]" />
        <SolutionOutlined className="text-xl text-[#555762]" />
        <UserOutlined className="text-xl text-[#555762]" />
      </div>
    </div>
  );
}
