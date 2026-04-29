'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import {
  Card, Row, Col, Avatar, List, Statistic, Skeleton, Empty, Tag, Button, Space, Typography, Divider,
} from 'antd';
import {
  ReloadOutlined,
  UserOutlined,
  ShopOutlined,
  SendOutlined,
  CheckCircleOutlined,
  RightOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  PlusOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import api from '@/lib/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text, Paragraph } = Typography;

const PageHeaderContent = ({ user, loading }: { user: any; loading: boolean }) => {
  if (loading) return <Skeleton avatar paragraph={{ rows: 1 }} active />;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Avatar size={64} src={user?.avatar} style={{ backgroundColor: '#1677ff', flexShrink: 0 }}>
        {user?.name?.[0] || 'F'}
      </Avatar>
      <div>
        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
          早安，{user?.name || '管理员'}，祝你开心每一天！
        </div>
        <Text type="secondary">
          {user?.title || '超级管理员'} | {user?.group || '天选OS 智能猎头平台'}
        </Text>
      </div>
    </div>
  );
};

const ExtraContent = ({ stats, loading }: { stats: any; loading: boolean }) => {
  if (loading) return <Skeleton active paragraph={{ rows: 1 }} />;
  return (
    <div style={{ display: 'flex', gap: 32 }}>
      <Statistic title="人才库" value={stats.candidateCount || 0} />
      <Statistic title="活跃岗位" value={stats.jobCount || 0} suffix={`/ ${stats.jobCount || 0}`} />
      <Statistic title="本月推荐" value={stats.recommendationCount || 0} />
    </div>
  );
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>({
    candidates: [],
    jobs: [],
    enterprises: [],
    recommendations: [],
    stats: { candidateCount: 0, jobCount: 0, recommendationCount: 0, acceptedCount: 0 },
    funnel: [],
  });

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [candRes, jobRes, statsRes, funnelRes] = await Promise.allSettled([
        api.get('/candidates'),
        api.get('/job-positions'),
        api.get('/analytics/overview'),
        api.get('/analytics/delivery-funnel'),
      ]);

      setData({
        candidates: candRes.status === 'fulfilled' ? (candRes.value.data?.items || candRes.value.data || []) : [],
        jobs: jobRes.status === 'fulfilled' ? (jobRes.value.data?.items || jobRes.value.data || []) : [],
        enterprises: [],
        recommendations: [],
        stats: statsRes.status === 'fulfilled' ? statsRes.value.data : {
          candidateCount: 0, jobCount: 0, recommendationCount: 0, acceptedCount: 0,
        },
        funnel: funnelRes.status === 'fulfilled' ? funnelRes.value.data : [],
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeJobs = data.jobs.filter((j: any) => j.status === 'active').slice(0, 6);

  const activities = [
    ...data.candidates.slice(0, 3).map((c: any) => ({
      id: c.id,
      user: { name: c.name || '系统', avatar: c.avatar },
      template: '新增候选人 @{user} 进入人才库',
      updatedAt: c.createdAt || new Date().toISOString(),
    })),
    ...data.jobs.slice(0, 2).map((j: any) => ({
      id: j.id,
      user: { name: '系统', avatar: undefined },
      template: '新职位 @{user} 已发布',
      updatedAt: j.createdAt || new Date().toISOString(),
    })),
  ];

  const quickLinks = [
    { title: '上传简历', href: '/candidates', icon: <PlusOutlined /> },
    { title: '创建职位', href: '/jobs', icon: <FileTextOutlined /> },
    { title: '交付看板', href: '/delivery', icon: <SendOutlined /> },
    { title: '数据罗盘', href: '/analysis', icon: <BarChartOutlined /> },
    { title: '客户管理', href: '/enterprises', icon: <ShopOutlined /> },
    { title: '合同管理', href: '/contracts', icon: <FileTextOutlined /> },
  ];

  const teamMembers = [
    { name: 'Franklin Jr.', role: '超级管理员' },
    { name: 'Alice', role: '猎头顾问' },
    { name: 'Bob', role: '客户经理' },
    { name: 'Carol', role: '交付专员' },
  ];

  const renderActivity = (item: any) => (
    <List.Item key={item.id}>
      <List.Item.Meta
        avatar={<Avatar src={item.user.avatar} style={{ backgroundColor: '#1677ff' }}>{item.user.name?.[0]}</Avatar>}
        title={
          <span>
            <a style={{ marginRight: 8 }}>{item.user.name}</a>
            <span style={{ color: '#666', fontWeight: 400 }}>
              {item.template.replace(/@\{user\}/, '')}
            </span>
          </span>
        }
        description={
          <span style={{ fontSize: 12, color: '#999' }}>
            {dayjs(item.updatedAt).fromNow()}
          </span>
        }
      />
    </List.Item>
  );

  return (
    <PageContainer
      content={<PageHeaderContent user={{ name: 'Franklin Jr.', title: '超级管理员' }} loading={loading} />}
      extraContent={<ExtraContent stats={data.stats} loading={loading} />}
      header={{
        extra: [
          <Button
            key="refresh"
            icon={<ReloadOutlined spin={refreshing} />}
            onClick={() => fetchData(true)}
            loading={refreshing}
          >
            刷新
          </Button>,
        ],
      }}
    >
      <Row gutter={24}>
        {/* Left Column */}
        <Col xl={16} lg={24} md={24} sm={24} xs={24}>
          {/* Active Jobs / Projects */}
          <Card
            style={{ marginBottom: 24 }}
            title="进行中的招聘项目"
            variant="borderless"
            extra={<a href="/jobs">全部职位 <RightOutlined style={{ fontSize: 10 }} /></a>}
            loading={loading}
          >
            <Row gutter={12}>
              {activeJobs.length > 0 ? activeJobs.map((job: any) => (
                <Col xs={24} sm={12} md={8} key={job.id} style={{ marginBottom: 12 }}>
                  <Card
                    size="small"
                    hoverable
                    variant="borderless"
                    style={{ background: '#fafafa' }}
                  >
                    <Card.Meta
                      avatar={
                        <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>
                          {job.enterprise?.name?.[0] || 'J'}
                        </Avatar>
                      }
                      title={<a href={`/jobs/${job.id}`} style={{ fontSize: 14 }}>{job.title || '未命名职位'}</a>}
                      description={
                        <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                          {job.enterprise?.name || '未知企业'} · {job.location || '北京'}
                        </Text>
                      }
                    />
                    <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Tag color="blue">{job.candidateCount || 0} 位候选人</Tag>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {job.salaryMin}K-{job.salaryMax}K
                      </Text>
                    </div>
                  </Card>
                </Col>
              )) : (
                <Col span={24}>
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无进行中的招聘项目" />
                </Col>
              )}
            </Row>
          </Card>

          {/* Activities */}
          <Card
            variant="borderless"
            title="最新动态"
            loading={loading}
            styles={{ body: { padding: activities.length > 0 ? 0 : 24 } }}
          >
            {activities.length > 0 ? (
              <List
                size="large"
                dataSource={activities}
                renderItem={renderActivity}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无动态" />
            )}
          </Card>
        </Col>

        {/* Right Column */}
        <Col xl={8} lg={24} md={24} sm={24} xs={24}>
          {/* Quick Start */}
          <Card
            style={{ marginBottom: 24 }}
            title="快速开始"
            variant="borderless"
          >
            <Row gutter={[8, 8]}>
              {quickLinks.map((link) => (
                <Col span={8} key={link.title}>
                  <a href={link.href} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 6, padding: '12px 4px', borderRadius: 8, transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 8, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      background: '#e6f4ff', color: '#1677ff', fontSize: 18,
                    }}>
                      {link.icon}
                    </div>
                    <span style={{ fontSize: 12, color: '#333' }}>{link.title}</span>
                  </a>
                </Col>
              ))}
            </Row>
          </Card>

          {/* Delivery Funnel */}
          <Card
            style={{ marginBottom: 24 }}
            title="交付漏斗"
            variant="borderless"
            extra={<Tag>近 30 天</Tag>}
            loading={loading}
          >
            {(() => {
              const funnelSteps = [
                { label: '推荐候选人', value: data.funnel?.find((f: any) => f.name === '已推荐')?.value || 0, color: '#1677ff' },
                { label: '进入面试', value: data.funnel?.find((f: any) => f.name === '面试')?.value || 0, color: '#13c2c2' },
                { label: '意向 Offer', value: data.funnel?.find((f: any) => f.name === 'Offer')?.value || 0, color: '#faad14' },
                { label: '成功入职', value: data.funnel?.find((f: any) => f.name === '已入职')?.value || 0, color: '#52c41a' },
              ];
              const maxVal = Math.max(funnelSteps[0]?.value || 1, 1);
              return funnelSteps.map((step, i) => (
                <div key={step.label} style={{ marginBottom: i < funnelSteps.length - 1 ? 12 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 13 }}>{step.label}</Text>
                    <Text strong style={{ color: step.color }}>{step.value}</Text>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: '#f0f0f0', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 4, background: step.color,
                      width: `${Math.max((step.value / maxVal) * 100, step.value > 0 ? 4 : 0)}%`,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              ));
            })()}
          </Card>

          {/* Team */}
          <Card
            variant="borderless"
            title="团队成员"
            styles={{ body: { paddingTop: 12, paddingBottom: 12 } }}
          >
            <Row gutter={24}>
              {teamMembers.map((member) => (
                <Col span={12} key={member.name} style={{ marginBottom: 8 }}>
                  <a style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>{member.name[0]}</Avatar>
                    <span style={{ fontSize: 13 }}>{member.name}</span>
                  </a>
                  <div style={{ fontSize: 11, color: '#999', marginLeft: 32 }}>{member.role}</div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
}
