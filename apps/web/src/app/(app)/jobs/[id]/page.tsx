'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card, Descriptions, Tag, Button, Space, Spin, message,
  Typography, Divider, Empty,
} from 'antd';
import {
  ArrowLeftOutlined,
  RobotOutlined,
  EnvironmentOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import api from '@/lib/api';

const { Title, Text, Paragraph } = Typography;

interface JobDetail {
  id: string;
  title: string;
  status: string;
  description: string;
  salaryMin?: number;
  salaryMax?: number;
  location?: string;
  skillTags?: string[];
  enterprise?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

const statusMap: Record<string, { color: string; label: string }> = {
  draft: { color: 'default', label: '草稿' },
  open: { color: 'success', label: '招聘中' },
  paused: { color: 'warning', label: '暂停' },
  closed: { color: 'error', label: '已关闭' },
};

export default function JobDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<JobDetail | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/job-positions/${id}`)
      .then((res) => setJob(res.data))
      .catch(() => message.error('加载职位详情失败'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!job) {
    return <Empty description="未找到该职位" className="mt-40" />;
  }

  const status = statusMap[job.status] || { color: 'default', label: job.status };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* 顶部导航 */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push('/jobs')}
        style={{ marginBottom: 16 }}
      >
        返回职位列表
      </Button>

      {/* 职位标题区域 */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
              {job.title || '未命名职位'}
            </Title>
            <Space size={16}>
              {job.enterprise && (
                <Tag color="blue">{job.enterprise.name}</Tag>
              )}
              <Tag color={status.color}>{status.label}</Tag>
              <Space size={4}>
                <DollarOutlined style={{ color: '#fa8c16' }} />
                <Text strong style={{ color: '#fa8c16' }}>
                  {job.salaryMin}K - {job.salaryMax}K
                </Text>
              </Space>
              <Space size={4}>
                <EnvironmentOutlined style={{ color: '#999' }} />
                <Text type="secondary">{job.location || '未设置'}</Text>
              </Space>
            </Space>
          </div>
          <Button
            type="primary"
            icon={<RobotOutlined />}
            onClick={() => router.push(`/jobs/${id}/matches`)}
          >
            AI 匹配
          </Button>
        </div>
      </Card>

      {/* 职位详情 */}
      <Card title="职位详情" style={{ marginBottom: 24 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="职位名称" span={2}>
            <Text strong>{job.title || '未命名职位'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="所属企业">
            {job.enterprise ? (
              <Button
                type="link"
                style={{ padding: 0 }}
                onClick={() => router.push(`/enterprises/${job.enterprise!.id}`)}
              >
                {job.enterprise.name}
              </Button>
            ) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="招聘状态">
            <Tag color={status.color}>{status.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="薪资范围">
            <Text strong style={{ color: '#fa8c16' }}>
              {job.salaryMin}K - {job.salaryMax}K
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="工作地点">
            <Space size={4}>
              <EnvironmentOutlined />
              <span>{job.location || '未设置'}</span>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="技能要求" span={2}>
            <Space wrap size={[4, 4]}>
              {job.skillTags && job.skillTags.length > 0 ? (
                job.skillTags.map((tag) => (
                  <Tag key={tag} color="gold">{tag}</Tag>
                ))
              ) : (
                <Text type="secondary">暂无技能标签</Text>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(job.createdAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {new Date(job.updatedAt).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 职位描述 */}
      <Card title="职位描述" style={{ marginBottom: 24 }}>
        <Paragraph style={{ whiteSpace: 'pre-wrap', color: '#333', lineHeight: 1.8 }}>
          {job.description || '暂无职位描述'}
        </Paragraph>
      </Card>

      {/* 底部操作 */}
      <Divider />
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <Space size={16}>
          <Button onClick={() => router.push('/jobs')}>
            返回职位列表
          </Button>
          <Button
            type="primary"
            icon={<RobotOutlined />}
            size="large"
            onClick={() => router.push(`/jobs/${id}/matches`)}
          >
            查看 AI 匹配结果
          </Button>
        </Space>
      </div>
    </div>
  );
}
