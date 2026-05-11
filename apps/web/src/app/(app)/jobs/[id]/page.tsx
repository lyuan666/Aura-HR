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
  Row,
  Col,
  ConfigProvider
} from 'antd';
import { 
  RobotOutlined, 
  LeftOutlined, 
  EditOutlined, 
  SaveOutlined, 
  CloseOutlined,
} from '@ant-design/icons';
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
      message.error('数据加载失败，请检查网络');
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
      message.success('更新成功');
      setIsEditing(false);
      fetchJob();
    } catch (e: any) {
      console.error(e);
      message.error('保存失败，请检查必填项');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !job) {
    return (
      <div style={{ padding: 40 }}>
        <Skeleton active paragraph={{ rows: 15 }} />
      </div>
    );
  }

  if (!job) {
    return (
      <div style={{ padding: 100, textAlign: 'center' }}>
        <Empty description="职位不存在" />
        <Button onClick={() => router.push('/jobs')}>返回列表</Button>
      </div>
    );
  }

  const statusMap: any = {
    pending: { label: '待处理', color: 'default' },
    matching: { label: '匹配中', color: 'blue' },
    recommending: { label: '推荐中', color: 'orange' },
    interviewing: { label: '面试中', color: 'purple' },
    closed: { label: '已关闭', color: 'red' },
    cancelled: { label: '已取消', color: 'default' }
  };

  return (
    <ConfigProvider locale={zhCN}>
      <div style={{ background: '#fff', minHeight: '100-screen', paddingBottom: 60 }}>
        {/* 顶部操作栏 */}
        <div style={{ 
          padding: '20px 40px', 
          borderBottom: '1px solid #eee', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: '#fff',
          zIndex: 100
        }}>
          <Space size={20}>
            <Button icon={<LeftOutlined />} onClick={() => router.push('/jobs')}>返回</Button>
            <Title level={3} style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#111' }}>
              {job.title}
            </Title>
            {!isEditing && <Tag color={statusMap[job.status]?.color} style={{ fontSize: '14px', padding: '2px 10px' }}>{statusMap[job.status]?.label}</Tag>}
          </Space>

          <Space>
            {isEditing ? (
              <>
                <Button size="large" onClick={() => { setIsEditing(false); form.resetFields(); }}>取消编辑</Button>
                <Button size="large" type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>保存更改</Button>
              </>
            ) : (
              <>
                <Button size="large" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>修改职位信息</Button>
                <Button size="large" type="primary" icon={<RobotOutlined />} onClick={() => router.push(`/jobs/${id}/matches`)}>开始 AI 匹配人才</Button>
              </>
            )}
          </Space>
        </div>

        <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
          <Form form={form} layout="vertical" disabled={!isEditing} initialValues={job}>
            <Row gutter={40}>
              <Col span={16}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  {/* 基本表单项 */}
                  <Card title={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>基础属性</span>} bordered>
                    <Row gutter={20}>
                      <Col span={12}>
                        <Form.Item name="title" label={<b style={{ fontSize: '16px' }}>职位名称</b>} rules={[{ required: true }]}>
                          <Input size="large" style={{ fontSize: '16px', color: '#000' }} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="department" label={<b style={{ fontSize: '16px' }}>所属部门</b>}>
                          <Input size="large" style={{ fontSize: '16px', color: '#000' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={20}>
                      <Col span={12}>
                        <Form.Item label={<b style={{ fontSize: '16px' }}>薪资范围 (K)</b>}>
                          <Space.Compact style={{ width: '100%' }}>
                            <Form.Item name="salaryMin" noStyle><InputNumber size="large" style={{ width: '50%', fontSize: '16px' }} /></Form.Item>
                            <Form.Item name="salaryMax" noStyle><InputNumber size="large" style={{ width: '50%', fontSize: '16px' }} /></Form.Item>
                          </Space.Compact>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="location" label={<b style={{ fontSize: '16px' }}>办公地点</b>}>
                          <Input size="large" style={{ fontSize: '16px', color: '#000' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>

                  {/* 核心要求 */}
                  <Card title={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>任职要求</span>} bordered>
                    <Form.Item name="requirements" noStyle>
                      <TextArea 
                        rows={12} 
                        style={{ 
                          fontSize: '17px', 
                          lineHeight: '1.6', 
                          color: '#222', 
                          background: isEditing ? '#fff' : '#f9f9f9',
                          padding: isEditing ? '12px' : '0',
                          border: isEditing ? '1px solid #d9d9d9' : 'none'
                        }} 
                      />
                    </Form.Item>
                  </Card>

                  {/* 职位描述 */}
                  <Card title={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>详细描述</span>} bordered>
                    <Form.Item name="description" noStyle>
                      <TextArea 
                        rows={12} 
                        style={{ 
                          fontSize: '17px', 
                          lineHeight: '1.6', 
                          color: '#333', 
                          background: isEditing ? '#fff' : '#f9f9f9',
                          padding: isEditing ? '12px' : '0',
                          border: isEditing ? '1px solid #d9d9d9' : 'none'
                        }} 
                      />
                    </Form.Item>
                  </Card>
                </div>
              </Col>

              <Col span={8}>
                <Card title={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>招聘设置</span>} bordered>
                  <Form.Item name="status" label={<b style={{ fontSize: '16px' }}>当前状态</b>}>
                    <Select size="large" style={{ width: '100%' }} options={Object.entries(statusMap).map(([k, v]: any) => ({ value: k, label: v.label }))} />
                  </Form.Item>

                  <Form.Item name="urgency" label={<b style={{ fontSize: '16px' }}>紧急程度</b>}>
                    <Select size="large" style={{ width: '100%' }} options={[
                      { value: 'low', label: '普通' },
                      { value: 'medium', label: '优先' },
                      { value: 'high', label: '紧急' },
                      { value: 'urgent', label: '特急' },
                    ]} />
                  </Form.Item>

                  <Form.Item name="headcount" label={<b style={{ fontSize: '16px' }}>招聘人数</b>}>
                    <InputNumber size="large" style={{ width: '100%' }} min={1} />
                  </Form.Item>

                  <div style={{ marginTop: 40, padding: 20, background: '#f0f7ff', borderRadius: 8, border: '1px solid #bae7ff' }}>
                    <p style={{ fontWeight: 'bold', color: '#0050b3', marginBottom: 8 }}>
                      <RobotOutlined /> AI 提示
                    </p>
                    <p style={{ fontSize: '14px', color: '#003a8c', lineHeight: '1.5', margin: 0 }}>
                      修改任职要求后，系统会自动重新计算该职位与人才库的匹配度。请确保关键技能词描述准确。
                    </p>
                  </div>
                </Card>
              </Col>
            </Row>
          </Form>
        </div>
      </div>
    </ConfigProvider>
  );
}
