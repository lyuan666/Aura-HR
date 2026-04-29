'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import {
  Card, Row, Col, Statistic, Typography, Tag, Table, Progress, Tooltip, Skeleton, Empty, Space, Button,
} from 'antd';
import {
  InfoCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  UserOutlined,
  ShopOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import api from '@/lib/api';

const { Text } = Typography;

const topColProps = {
  xs: 24, sm: 12, md: 12, lg: 12, xl: 6,
  style: { marginBottom: 24 } as React.CSSProperties,
};

export default function AnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    candidates: [],
    jobs: [],
    stats: { candidateCount: 0, jobCount: 0, recommendationCount: 0, acceptedCount: 0 },
    funnel: [],
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [candRes, jobRes, statsRes, funnelRes] = await Promise.allSettled([
        api.get('/candidates'),
        api.get('/job-positions'),
        api.get('/analytics/overview'),
        api.get('/analytics/delivery-funnel'),
      ]);

      setData({
        candidates: candRes.status === 'fulfilled' ? (candRes.value.data?.items || candRes.value.data || []) : [],
        jobs: jobRes.status === 'fulfilled' ? (jobRes.value.data?.items || jobRes.value.data || []) : [],
        stats: statsRes.status === 'fulfilled' ? statsRes.value.data : {
          candidateCount: 0, jobCount: 0, recommendationCount: 0, acceptedCount: 0,
        },
        funnel: funnelRes.status === 'fulfilled' ? funnelRes.value.data : [],
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Skill distribution (mock from candidate data)
  const skillDistribution = [
    { skill: 'Java', count: 12, percent: 80 },
    { skill: 'React', count: 9, percent: 60 },
    { skill: 'Python', count: 8, percent: 53 },
    { skill: 'Go', count: 6, percent: 40 },
    { skill: 'Node.js', count: 5, percent: 33 },
    { skill: 'Spring', count: 7, percent: 47 },
    { skill: 'Vue', count: 4, percent: 27 },
    { skill: 'Redis', count: 6, percent: 40 },
  ];

  // Source stats
  const sourceStats = [
    { source: '主动投递', count: 45, color: '#1677ff' },
    { source: '邮箱归集', count: 28, color: '#52c41a' },
    { source: 'AI 推荐', count: 18, color: '#722ed1' },
    { source: '猎头导入', count: 12, color: '#fa8c16' },
    { source: '内部推荐', count: 8, color: '#13c2c2' },
  ];
  const sourceTotal = sourceStats.reduce((s, i) => s + i.count, 0);

  // Delivery funnel data
  const funnelSteps = [
    { label: '推荐候选人', value: data.funnel?.find((f: any) => f.name === '已推荐')?.value || 0, color: '#1677ff' },
    { label: '进入面试', value: data.funnel?.find((f: any) => f.name === '面试')?.value || 0, color: '#13c2c2' },
    { label: '意向 Offer', value: data.funnel?.find((f: any) => f.name === 'Offer')?.value || 0, color: '#faad14' },
    { label: '成功入职', value: data.funnel?.find((f: any) => f.name === '已入职')?.value || 0, color: '#52c41a' },
  ];

  // Recent jobs table columns
  const jobColumns = [
    { title: '职位名称', dataIndex: 'title', key: 'title', render: (t: string) => <Text strong>{t || '未命名'}</Text> },
    { title: '企业', dataIndex: ['enterprise', 'name'], key: 'enterprise', render: (t: string) => t || '-' },
    { title: '候选人', dataIndex: 'candidateCount', key: 'count', render: (v: number) => v || 0 },
    {
      title: '进度', key: 'progress', render: (_: any, r: any) => (
        <Progress percent={Math.min((r.candidateCount || 0) * 10, 100)} size="small" style={{ width: 100 }} />
      ),
    },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (s: string) => {
        const map: Record<string, { color: string; text: string }> = {
          active: { color: 'green', text: '在招' },
          closed: { color: 'red', text: '已关闭' },
          draft: { color: 'default', text: '草稿' },
        };
        const cfg = map[s] || map.draft;
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
  ];

  return (
    <PageContainer
      header={{
        title: '数据罗盘',
        subTitle: '全维度数据分析与洞察',
        extra: [
          <Button key="refresh" icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>刷新数据</Button>,
        ],
      }}
    >
      {/* Row 1: KPI Cards */}
      <Row gutter={24}>
        <Col {...topColProps}>
          <Card variant="borderless" loading={loading}>
            <Statistic
              title={<Space>人才库总量 <Tooltip title="全量候选人数据"><InfoCircleOutlined style={{ color: '#999' }} /></Tooltip></Space>}
              value={data.stats?.candidateCount || data.candidates?.length || 0}
              prefix={<UserOutlined />}
              suffix={
                <Text style={{ fontSize: 14, color: '#52c41a' }}>
                  <ArrowUpOutlined /> 12%
                </Text>
              }
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>本周新增 23 人</Text>
            </div>
          </Card>
        </Col>
        <Col {...topColProps}>
          <Card variant="borderless" loading={loading}>
            <Statistic
              title={<Space>活跃岗位 <Tooltip title="当前在招职位数"><InfoCircleOutlined style={{ color: '#999' }} /></Tooltip></Space>}
              value={data.stats?.jobCount || data.jobs?.length || 0}
              prefix={<ShopOutlined />}
              suffix={
                <Text style={{ fontSize: 14, color: '#52c41a' }}>
                  <ArrowUpOutlined /> 3
                </Text>
              }
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>本月新增 5 个岗位</Text>
            </div>
          </Card>
        </Col>
        <Col {...topColProps}>
          <Card variant="borderless" loading={loading}>
            <Statistic
              title={<Space>交付中推荐 <Tooltip title="流程中的推荐记录"><InfoCircleOutlined style={{ color: '#999' }} /></Tooltip></Space>}
              value={data.stats?.recommendationCount || 0}
              prefix={<SendOutlined />}
              suffix={
                <Text style={{ fontSize: 14, color: '#faad14' }}>
                  <ArrowDownOutlined /> 2.1%
                </Text>
              }
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>转化率 68%</Text>
            </div>
          </Card>
        </Col>
        <Col {...topColProps}>
          <Card variant="borderless" loading={loading}>
            <Statistic
              title={<Space>本月入职 <Tooltip title="本月成功入职候选人"><InfoCircleOutlined style={{ color: '#999' }} /></Tooltip></Space>}
              value={data.stats?.acceptedCount || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
            <div style={{ marginTop: 12, marginBottom: -4 }}>
              <Progress percent={78} strokeColor={{ from: '#108ee9', to: '#87d068' }} showInfo={false} />
            </div>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>目标完成率 78%</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Row 2: Delivery Funnel + Source Distribution */}
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col xl={14} lg={24} md={24} sm={24} xs={24}>
          <Card title="全链路交付漏斗" variant="borderless" extra={<Tag color="blue">近 30 天</Tag>}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <div style={{ padding: '8px 0' }}>
                {funnelSteps.map((step, i) => {
                  const maxVal = Math.max(funnelSteps[0]?.value || 1, 1);
                  const widthPercent = Math.max((step.value / maxVal) * 100, step.value > 0 ? 6 : 0);
                  return (
                    <div key={step.label} style={{ marginBottom: i < funnelSteps.length - 1 ? 20 : 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text strong>{step.label}</Text>
                        <Space>
                          <Text strong style={{ color: step.color, fontSize: 20 }}>{step.value}</Text>
                          {i > 0 && funnelSteps[i - 1].value > 0 && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              ({Math.round((step.value / funnelSteps[i - 1].value) * 100)}%)
                            </Text>
                          )}
                        </Space>
                      </div>
                      <div style={{
                        height: 36, borderRadius: 6, background: '#f5f5f5', overflow: 'hidden',
                        display: 'flex', alignItems: 'center',
                      }}>
                        <div style={{
                          height: '100%', borderRadius: 6, background: step.color,
                          width: `${widthPercent}%`, transition: 'width 0.6s ease',
                          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 12,
                        }}>
                          {step.value > 0 && widthPercent > 15 && (
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>
                              {Math.round((step.value / maxVal) * 100)}%
                            </Text>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>

        <Col xl={10} lg={24} md={24} sm={24} xs={24}>
          <Card title="候选人来源分布" variant="borderless">
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {sourceStats.map((item) => (
                <div key={item.source}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>{item.source}</Text>
                    <Space size={8}>
                      <Text strong style={{ color: item.color }}>{item.count}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {Math.round((item.count / sourceTotal) * 100)}%
                      </Text>
                    </Space>
                  </div>
                  <Progress
                    percent={Math.round((item.count / sourceTotal) * 100)}
                    showInfo={false}
                    strokeColor={item.color}
                    size="small"
                  />
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Row 3: Skill Distribution + Recent Jobs */}
      <Row gutter={24}>
        <Col xl={10} lg={24} md={24} sm={24} xs={24}>
          <Card title="热门技能分布" variant="borderless" loading={loading}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              {skillDistribution.map((item) => (
                <div key={item.skill}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Tag>{item.skill}</Tag>
                    <Text type="secondary">{item.count} 人</Text>
                  </div>
                  <Progress percent={item.percent} showInfo={false} size="small" strokeColor="#1677ff" />
                </div>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xl={14} lg={24} md={24} sm={24} xs={24}>
          <Card title="职位招聘概览" variant="borderless" extra={<a href="/jobs">查看全部</a>}>
            <Table
              columns={jobColumns}
              dataSource={data.jobs.slice(0, 5)}
              rowKey="id"
              size="small"
              pagination={false}
              loading={loading}
              locale={{ emptyText: <Empty description="暂无职位数据" /> }}
            />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
}
