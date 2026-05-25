'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Statistic,
  Select,
  Space,
  Button,
  App,
  Skeleton,
  Empty,
  Typography,
  Tooltip,
} from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

const { Text } = Typography;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  interview_scheduled: { label: '已安排', color: 'blue' },
  interviewed: { label: '已完成', color: 'green' },
};

interface InterviewRecord {
  id: string;
  candidateName: string;
  jobTitle: string;
  interviewDate: string;
  status: string;
  interviewReport?: string;
}

export default function InterviewsPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InterviewRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/recommendations/interviews');
      setData(res.data?.items || res.data || []);
    } catch (e) {
      message.error('面试数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    if (!statusFilter) return data;
    return data.filter((item) => item.status === statusFilter);
  }, [data, statusFilter]);

  const stats = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const todayCount = data.filter((item) => {
      if (!item.interviewDate) return false;
      return item.interviewDate.slice(0, 10) === todayStr;
    }).length;

    const weekCount = data.filter((item) => {
      if (!item.interviewDate) return false;
      const d = new Date(item.interviewDate);
      return d >= startOfWeek && d <= endOfWeek;
    }).length;

    const scheduledCount = data.filter(
      (item) => item.status === 'interview_scheduled',
    ).length;

    const completedCount = data.filter(
      (item) => item.status === 'interviewed',
    ).length;

    return { todayCount, weekCount, scheduledCount, completedCount };
  }, [data]);

  const columns = [
    {
      title: '候选人姓名',
      dataIndex: 'candidateName',
      key: 'candidateName',
      width: 160,
      render: (name: string) => (
        <Text strong style={{ fontSize: 14 }}>
          {name || '未知'}
        </Text>
      ),
    },
    {
      title: '应聘职位',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      width: 200,
      render: (title: string) => (
        <Text type="secondary">{title || '未关联职位'}</Text>
      ),
    },
    {
      title: '面试时间',
      dataIndex: 'interviewDate',
      key: 'interviewDate',
      width: 200,
      render: (date: string) => {
        if (!date) return <Text type="secondary">--</Text>;
        const d = new Date(date);
        return (
          <Space size={4}>
            <CalendarOutlined style={{ color: '#1677ff' }} />
            <Text>
              {d.toLocaleDateString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
              })}{' '}
              {d.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const config = STATUS_CONFIG[status] || {
          label: status,
          color: 'default',
        };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: InterviewRecord) => (
        <Tooltip title="在交付看板中查看详情">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => router.push('/delivery')}
          >
            查看详情
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: '面试管理',
        subTitle: '面试安排与进度追踪',
      }}
    >
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="今日面试"
              value={stats.todayCount}
              prefix={<CalendarOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="本周面试"
              value={stats.weekCount}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="待安排"
              value={stats.scheduledCount}
              prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="已完成"
              value={stats.completedCount}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选栏 + 列表 */}
      <Card bordered={false} style={{ borderRadius: 8 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Space>
            <Text strong style={{ fontSize: 15 }}>
              面试列表
            </Text>
            <Tag color="blue">{filteredData.length} 条记录</Tag>
          </Space>
          <Space>
            <Text type="secondary">按状态筛选：</Text>
            <Select
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              allowClear
              placeholder="全部状态"
              style={{ width: 160 }}
              options={[
                {
                  value: 'interview_scheduled',
                  label: '已安排',
                },
                {
                  value: 'interviewed',
                  label: '已完成',
                },
              ]}
            />
          </Space>
        </div>

        {loading ? (
          <div style={{ padding: '24px 0' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton
                key={i}
                active
                paragraph={{ rows: 1 }}
                style={{ marginBottom: 16 }}
              />
            ))}
          </div>
        ) : filteredData.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无面试记录"
            style={{ padding: '60px 0' }}
          >
            <Button type="primary" onClick={() => router.push('/delivery')}>
              前往交付看板安排面试
            </Button>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            size="middle"
          />
        )}
      </Card>
    </PageContainer>
  );
}
