'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageContainer } from '@ant-design/pro-components';
import { 
  Card, 
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
  App,
  Divider,
  Row,
  Col,
  Breadcrumb,
  ConfigProvider
} from 'antd';
import { 
  RobotOutlined, 
  LeftOutlined, 
  EditOutlined, 
  SaveOutlined, 
  CloseOutlined,
  EnvironmentOutlined, 
  TeamOutlined, 
  DollarOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  BankOutlined,
  DeploymentUnitOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import zhCN from 'antd/locale/zh_CN';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      message.error('职位数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      await api.patch(`/job-positions/${id}`, values);
      message.success('职位信息已更新');
      setIsEditing(false);
      fetchJob();
    } catch (e: any) {
      console.error(e);
      message.error('保存失败，请检查输入项');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !job) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <Skeleton active avatar paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Empty description="找不到该职位信息">
          <Button type="primary" onClick={() => router.push('/jobs')}>返回职位列表</Button>
        </Empty>
      </div>
    );
  }

  const statusOptions = [
    { value: 'pending', label: '待处理', color: 'default' },
    { value: 'matching', label: '匹配中', color: 'blue' },
    { value: 'recommending', label: '推荐中', color: 'orange' },
    { value: 'interviewing', label: '面试中', color: 'purple' },
    { value: 'closed', label: '已关闭', color: 'red' },
    { value: 'cancelled', label: '已取消', color: 'default' }
  ];

  const urgencyOptions = [
    { value: 'low', label: '普通' },
    { value: 'medium', label: '优先' },
    { value: 'high', label: '紧急' },
    { value: 'urgent', label: '特急' }
  ];

  return (
    <ConfigProvider locale={zhCN}>
      <div className="min-h-screen bg-[#f8fafc] pb-12">
        {/* Header Section */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                icon={<LeftOutlined />} 
                type="text" 
                onClick={() => router.push('/jobs')}
                className="hover:bg-slate-100"
              />
              <div className="flex flex-col">
                <Breadcrumb 
                  className="text-[10px] uppercase tracking-wider mb-1"
                  items={[{ title: '职位图谱' }, { title: '职位详情' }]}
                />
                <Title level={4} className="!mb-0 !leading-none flex items-center gap-2">
                  {job.title}
                  {!isEditing && <Tag color="blue" className="ml-2 border-none rounded-full px-3">{statusOptions.find(o => o.value === job.status)?.label}</Tag>}
                </Title>
              </div>
            </div>

            <div className="flex gap-2">
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div 
                    key="edit-btns"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex gap-2"
                  >
                    <Button onClick={() => { setIsEditing(false); form.setFieldsValue(job); }}>取消</Button>
                    <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>保存修改</Button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="view-btns"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex gap-2"
                  >
                    <Button icon={<EditOutlined />} onClick={() => setIsEditing(true)}>编辑详情</Button>
                    <Button type="primary" icon={<RobotOutlined />} onClick={() => router.push(`/jobs/${id}/matches`)}>AI 智能匹配</Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <Form form={form} layout="vertical" disabled={!isEditing} initialValues={job}>
            <Row gutter={24}>
              {/* Left Column: Core Content */}
              <Col xs={24} lg={16}>
                <div className="space-y-6">
                  {/* Basic Info Grid */}
                  <Card bordered={false} className="rounded-xl shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <Form.Item name="title" label="职位名称" rules={[{ required: true, message: '请输入职位名称' }]}>
                        <Input size="large" placeholder="例如：高级前端开发工程师" className="rounded-lg" />
                      </Form.Item>
                      <Form.Item name="department" label="所属部门">
                        <Input size="large" placeholder="例如：技术中心 / 基础架构部" className="rounded-lg" />
                      </Form.Item>
                      <Form.Item name="location" label="工作地点">
                        <Input size="large" prefix={<EnvironmentOutlined className="text-slate-400" />} placeholder="例如：北京 - 朝阳区" className="rounded-lg" />
                      </Form.Item>
                      <Form.Item label="薪资范围 (K)">
                        <Space.Compact className="w-full">
                          <Form.Item name="salaryMin" noStyle>
                            <InputNumber size="large" min={0} placeholder="最小值" className="w-1/2 rounded-l-lg" />
                          </Form.Item>
                          <Form.Item name="salaryMax" noStyle>
                            <InputNumber size="large" min={0} placeholder="最大值" className="w-1/2 rounded-r-lg" />
                          </Form.Item>
                        </Space.Compact>
                      </Form.Item>
                    </div>
                  </Card>

                  {/* Requirements Section */}
                  <Card 
                    bordered={false} 
                    className="rounded-xl shadow-sm"
                    title={<Space><CheckCircleOutlined className="text-blue-500" /><span>任职要求</span></Space>}
                  >
                    <Form.Item name="requirements" noStyle>
                      <TextArea 
                        rows={10} 
                        className={`text-base leading-relaxed ${!isEditing ? 'border-none p-0 resize-none' : 'rounded-lg bg-slate-50'}`}
                        placeholder="请输入详细的任职要求..."
                      />
                    </Form.Item>
                  </Card>

                  {/* Description Section */}
                  <Card 
                    bordered={false} 
                    className="rounded-xl shadow-sm"
                    title={<Space><InfoCircleOutlined className="text-blue-500" /><span>职位描述</span></Space>}
                  >
                    <Form.Item name="description" noStyle>
                      <TextArea 
                        rows={10} 
                        className={`text-base leading-relaxed ${!isEditing ? 'border-none p-0 resize-none' : 'rounded-lg bg-slate-50'}`}
                        placeholder="请输入详细的职位描述和职责..."
                      />
                    </Form.Item>
                  </Card>
                </div>
              </Col>

              {/* Right Column: Meta & Sidebar */}
              <Col xs={24} lg={8}>
                <div className="space-y-6">
                  <Card bordered={false} className="rounded-xl shadow-sm bg-white">
                    <Title level={5} className="!mb-6 text-slate-800 flex items-center gap-2">
                      <DeploymentUnitOutlined className="text-blue-600" /> 管理配置
                    </Title>
                    
                    <Form.Item name="status" label="当前流程阶段">
                      <Select size="large" className="w-full rounded-lg" options={statusOptions} />
                    </Form.Item>

                    <Form.Item name="urgency" label="紧急程度">
                      <Select size="large" className="w-full rounded-lg" options={urgencyOptions} />
                    </Form.Item>

                    <Form.Item name="headcount" label="计划招聘人数">
                      <InputNumber size="large" min={1} className="w-full rounded-lg" prefix={<TeamOutlined className="text-slate-400" />} />
                    </Form.Item>

                    <Divider className="my-6 border-slate-100" />

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <Space className="mb-2">
                        <RobotOutlined className="text-blue-600" />
                        <span className="font-bold text-blue-900">AI 智能分析</span>
                      </Space>
                      <p className="text-xs text-blue-700 leading-relaxed m-0">
                        该职位已被 AI 索引。修改核心要求后，AI 将在后台自动重新生成人才匹配模型，以确保推荐精准度。
                      </p>
                    </div>
                  </Card>

                  {/* Enterprise Card */}
                  <Card bordered={false} className="rounded-xl shadow-sm">
                    <Space direction="vertical" className="w-full" size={16}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                          <BankOutlined />
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">所属企业</div>
                          <div className="font-bold text-slate-800">{job.enterprise?.name || '通用职位'}</div>
                        </div>
                      </div>
                    </Space>
                  </Card>
                </div>
              </Col>
            </Row>
          </Form>
        </div>
      </div>

      <style jsx global>{`
        .ant-form-item-label label {
          font-weight: 600 !important;
          color: #64748b !important;
          font-size: 13px !important;
        }
        .ant-card-head {
          border-bottom: 1px solid #f1f5f9 !important;
          min-height: 56px !important;
        }
        .ant-card-head-title {
          font-size: 14px !important;
          font-weight: 700 !important;
          color: #1e293b !important;
          letter-spacing: 0.5px;
        }
        .ant-input-number-handler-wrap {
          display: none;
        }
      `}</style>
    </ConfigProvider>
  );
}
