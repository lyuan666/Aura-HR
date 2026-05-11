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
  ConfigProvider,
  Result
} from 'antd';
import { 
  LeftOutlined, 
  EditOutlined, 
  SaveOutlined, 
  CloseOutlined,
  RobotOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  DollarCircleOutlined,
  CalendarOutlined,
  ProfileOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import api from '@/lib/api';
import zhCN from 'antd/locale/zh_CN';

const { Title, Text, Paragraph } = Typography;
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
      message.error('无法连接至云端数据库');
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
      message.success('更新已同步');
      setIsEditing(false);
      fetchJob();
    } catch (e: any) {
      console.error(e);
      message.error('保存失败，请检查数据合法性');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !job) {
    return (
      <div className="p-12 max-w-7xl mx-auto">
        <Skeleton active paragraph={{ rows: 12 }} />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Result
          status="404"
          title="职位档案不存在"
          subTitle="该职位可能已被归档或删除"
          extra={<Button type="primary" onClick={() => router.push('/jobs')}>返回职位中心</Button>}
        />
      </div>
    );
  }

  const statusMap: any = {
    pending: { label: '待开放', color: 'default' },
    matching: { label: '人才匹配中', color: 'processing' },
    recommending: { label: '面试推荐中', color: 'warning' },
    interviewing: { label: '正在面试', color: 'purple' },
    closed: { label: '已关闭', color: 'error' },
    cancelled: { label: '已取消', color: 'default' }
  };

  return (
    <ConfigProvider locale={zhCN} theme={{
      token: {
        colorPrimary: '#2563eb',
        borderRadius: 8,
      },
    }}>
      <div className="min-h-screen bg-[#fcfcfd]">
        {/* 精简顶部导航 */}
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                type="text" 
                icon={<LeftOutlined />} 
                onClick={() => router.push('/jobs')}
                className="text-gray-500"
              >
                返回
              </Button>
              <Divider type="vertical" className="h-6" />
              <Title level={4} className="!m-0 !text-gray-900 font-bold">
                {isEditing ? '编辑职位详情' : job.title}
              </Title>
              {!isEditing && <Tag color={statusMap[job.status]?.color} className="rounded-full px-3">{statusMap[job.status]?.label}</Tag>}
            </div>

            <Space size="middle">
              {isEditing ? (
                <>
                  <Button onClick={() => { setIsEditing(false); form.resetFields(); }}>放弃修改</Button>
                  <Button type="primary" loading={saving} onClick={handleSave} className="bg-blue-600">保存同步</Button>
                </>
              ) : (
                <>
                  <Button icon={<EditOutlined />} onClick={() => setIsEditing(true)}>修改信息</Button>
                  <Button type="primary" icon={<RobotOutlined />} onClick={() => router.push(`/jobs/${id}/matches`)} className="bg-blue-600">
                    AI 智能匹配
                  </Button>
                </>
              )}
            </Space>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-10">
          <Form form={form} layout="vertical" disabled={!isEditing} initialValues={job} requiredMark="optional">
            <Row gutter={40}>
              {/* 主体部分 */}
              <Col xs={24} lg={16}>
                <div className="space-y-8">
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <ProfileOutlined className="text-blue-600" />
                      <Text className="text-gray-900 font-bold text-lg">职位核心信息</Text>
                    </div>
                    <Card bordered={false} className="shadow-[0_1px_3px_rgba(0,0,0,0.1)] rounded-xl">
                      <Row gutter={24}>
                        <Col span={12}>
                          <Form.Item name="title" label="职位名称" rules={[{ required: true }]}>
                            <Input size="large" className="rounded-lg" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="department" label="所属部门">
                            <Input size="large" className="rounded-lg" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={24}>
                        <Col span={12}>
                          <Form.Item label="月薪范围 (K)">
                            <Space.Compact className="w-full">
                              <Form.Item name="salaryMin" noStyle><InputNumber size="large" className="w-1/2 rounded-l-lg" placeholder="最低" /></Form.Item>
                              <Form.Item name="salaryMax" noStyle><InputNumber size="large" className="w-1/2 rounded-r-lg" placeholder="最高" /></Form.Item>
                            </Space.Compact>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="location" label="办公城市">
                            <Input size="large" prefix={<EnvironmentOutlined className="text-gray-400" />} className="rounded-lg" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  </section>

                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <ProfileOutlined className="text-blue-600" />
                      <Text className="text-gray-900 font-bold text-lg">任职要求</Text>
                    </div>
                    <Card bordered={false} className="shadow-[0_1px_3px_rgba(0,0,0,0.1)] rounded-xl">
                      <Form.Item name="requirements" noStyle>
                        <TextArea 
                          rows={12} 
                          className={`text-[16px] leading-relaxed text-gray-800 ${!isEditing ? 'border-none p-0 !bg-transparent resize-none' : 'rounded-lg bg-gray-50'}`}
                        />
                      </Form.Item>
                    </Card>
                  </section>

                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <ProfileOutlined className="text-blue-600" />
                      <Text className="text-gray-900 font-bold text-lg">职位详情描述</Text>
                    </div>
                    <Card bordered={false} className="shadow-[0_1px_3px_rgba(0,0,0,0.1)] rounded-xl">
                      <Form.Item name="description" noStyle>
                        <TextArea 
                          rows={12} 
                          className={`text-[16px] leading-relaxed text-gray-700 ${!isEditing ? 'border-none p-0 !bg-transparent resize-none' : 'rounded-lg bg-gray-50'}`}
                        />
                      </Form.Item>
                    </Card>
                  </section>
                </div>
              </Col>

              {/* 侧边设置 */}
              <Col xs={24} lg={8}>
                <div className="space-y-8 sticky top-24">
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <DashboardOutlined className="text-blue-600" />
                      <Text className="text-gray-900 font-bold text-lg">流程与管控</Text>
                    </div>
                    <Card bordered={false} className="shadow-[0_1px_3px_rgba(0,0,0,0.1)] rounded-xl">
                      <Form.Item name="status" label="当前所处阶段">
                        <Select size="large" options={Object.entries(statusMap).map(([k, v]: any) => ({ value: k, label: v.label }))} className="w-full" />
                      </Form.Item>
                      <Form.Item name="urgency" label="紧急程度等级">
                        <Select size="large" className="w-full" options={[
                          { value: 'low', label: '普通优先级' },
                          { value: 'medium', label: '优先处理' },
                          { value: 'high', label: '高度紧急' },
                          { value: 'urgent', label: '特急需求' },
                        ]} />
                      </Form.Item>
                      <Form.Item name="headcount" label="计划招聘人数">
                        <InputNumber size="large" className="w-full" prefix={<TeamOutlined className="text-gray-400" />} />
                      </Form.Item>

                      <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between text-gray-500 text-sm">
                        <span>所属企业：</span>
                        <Text strong className="text-gray-800">{job.enterprise?.name || '默认企业'}</Text>
                      </div>
                    </Card>
                  </section>

                  {/* AI 助手卡片 */}
                  <div className="p-6 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                    <div className="flex items-center gap-2 mb-3 text-white">
                      <RobotOutlined className="text-xl" />
                      <span className="font-bold">AI 智能辅助已启用</span>
                    </div>
                    <p className="text-blue-50 text-sm leading-relaxed mb-0">
                      我们已根据您的任职要求在后台建立了向量索引。修改描述后，人才画像将自动重新对齐。
                    </p>
                  </div>
                </div>
              </Col>
            </Row>
          </Form>
        </div>
      </div>

      <style jsx global>{`
        .ant-form-item-label label {
          font-weight: 600 !important;
          color: #374151 !important;
          font-size: 14px !important;
          margin-bottom: 4px !important;
        }
        .ant-input-number-handler-wrap {
          display: none;
        }
        .ant-card {
          border-radius: 12px !important;
        }
      `}</style>
    </ConfigProvider>
  );
}
