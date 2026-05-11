'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageContainer } from '@ant-design/pro-components';
import { 
  Card, 
  Descriptions, 
  Tag, 
  Button, 
  Typography, 
  Space, 
  Skeleton, 
  Empty, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  App 
} from 'antd';
import { 
  RobotOutlined, 
  LeftOutlined, 
  EditOutlined, 
  SaveOutlined, 
  CloseOutlined,
  EnvironmentOutlined, 
  TeamOutlined, 
  DollarOutlined
} from '@ant-design/icons';
import api from '@/lib/api';

const { Paragraph } = Typography;
const { TextArea } = Input;

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [job, setJob] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchJob = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/job-positions/${id}`);
      setJob(res.data);
      form.setFieldsValue(res.data);
    } catch (e) {
      console.error(e);
      message.error('职位详情加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [id]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await api.patch(`/job-positions/${id}`, values);
      message.success('职位信息更新成功');
      setIsEditing(false);
      fetchJob();
    } catch (e) {
      console.error(e);
      message.error('保存失败，请检查输入项');
    }
  };

  if (loading && !job) {
    return (
      <PageContainer>
        <Card>
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      </PageContainer>
    );
  }

  if (!job) {
    return (
      <PageContainer>
        <Card>
          <Empty description="职位不存在或已被删除" />
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Button icon={<LeftOutlined />} onClick={() => router.push('/jobs')}>返回职位列表</Button>
          </div>
        </Card>
      </PageContainer>
    );
  }

  const urgencyColors = {
    low: 'blue',
    medium: 'orange',
    high: 'volcano',
    urgent: 'red'
  };

  const statusOptions = [
    { value: 'pending', label: '待审核', color: 'default' },
    { value: 'matching', label: '匹配中', color: 'processing' },
    { value: 'recommending', label: '推荐中', color: 'warning' },
    { value: 'interviewing', label: '面试中', color: 'purple' },
    { value: 'closed', label: '已关闭', color: 'error' },
    { value: 'cancelled', label: '已取消', color: 'default' }
  ];

  const urgencyOptions = [
    { value: 'low', label: 'LOW' },
    { value: 'medium', label: 'MEDIUM' },
    { value: 'high', label: 'HIGH' },
    { value: 'urgent', label: 'URGENT' }
  ];

  return (
    <PageContainer
      header={{
        title: isEditing ? '编辑职位' : job.title,
        breadcrumb: {
          items: [
            { title: '职位图谱', href: '/jobs' },
            { title: '职位详情' }
          ]
        },
        extra: isEditing ? [
          <Button key="cancel" icon={<CloseOutlined />} onClick={() => setIsEditing(false)}>取消</Button>,
          <Button key="save" type="primary" icon={<SaveOutlined />} onClick={handleSave}>保存更改</Button>
        ] : [
          <Button key="edit" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>编辑信息</Button>,
          <Button 
            key="match" 
            type="primary" 
            icon={<RobotOutlined />} 
            onClick={() => router.push(`/jobs/${id}/matches`)}
          >
            AI 智能匹配
          </Button>
        ]
      }}
    >
      <Form form={form} layout="vertical" disabled={!isEditing}>
        <div className="flex flex-col gap-6">
          <Card bordered={false} className="shadow-sm" title="基本信息">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
              <Form.Item name="title" label="职位名称" rules={[{ required: true }]}>
                <Input placeholder="请输入职位名称" />
              </Form.Item>
              <Form.Item name="department" label="所属部门">
                <Input placeholder="请输入部门" />
              </Form.Item>
              <Form.Item label="薪资范围 (K)">
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item name="salaryMin" noStyle>
                    <InputNumber min={0} placeholder="Min" style={{ width: '50%' }} />
                  </Form.Item>
                  <Form.Item name="salaryMax" noStyle>
                    <InputNumber min={0} placeholder="Max" style={{ width: '50%' }} />
                  </Form.Item>
                </Space.Compact>
              </Form.Item>
              <Form.Item name="location" label="工作地点">
                <Input prefix={<EnvironmentOutlined />} placeholder="请输入地点" />
              </Form.Item>
              <Form.Item name="headcount" label="招聘人数">
                <InputNumber min={1} style={{ width: '100%' }} prefix={<TeamOutlined />} />
              </Form.Item>
              <Form.Item name="urgency" label="紧急程度">
                <Select options={urgencyOptions} />
              </Form.Item>
              <Form.Item name="status" label="当前状态">
                <Select options={statusOptions} />
              </Form.Item>
            </div>
          </Card>

          <Card bordered={false} title="任职要求" className="shadow-sm">
            <Form.Item name="requirements" noStyle>
              <TextArea 
                rows={8} 
                variant={isEditing ? 'outlined' : 'borderless'} 
                placeholder="请输入详细要求" 
                style={{ padding: 0, resize: isEditing ? 'vertical' : 'none' }}
              />
            </Form.Item>
          </Card>

          <Card bordered={false} title="职位描述" className="shadow-sm">
            <Form.Item name="description" noStyle>
              <TextArea 
                rows={10} 
                variant={isEditing ? 'outlined' : 'borderless'} 
                placeholder="请输入详细描述" 
                style={{ padding: 0, resize: isEditing ? 'vertical' : 'none' }}
              />
            </Form.Item>
          </Card>
        </div>
      </Form>
    </PageContainer>
  );
}
