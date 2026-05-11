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
  Tooltip,
  Divider,
  Badge,
  Row,
  Col
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
  CalendarOutlined,
  FireOutlined,
  RocketOutlined,
  InfoCircleOutlined,
  AppstoreOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { message, modal } = App.useApp();
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
      message.error('无法获取职位深度档案');
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
      message.success({
        content: '职位核心数据已更新同步',
        icon: <RocketOutlined className="text-purple-500" />
      });
      setIsEditing(false);
      fetchJob();
    } catch (e: any) {
      console.error(e);
      const errorMsg = e.response?.data?.message;
      if (Array.isArray(errorMsg)) {
        message.error(`数据验证失败: ${errorMsg.join(', ')}`);
      } else {
        message.error(errorMsg || '保存执行异常，请检查网络连接');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading && !job) {
    return (
      <div className="p-8 bg-[#0B0D11] min-h-screen">
        <Skeleton active avatar paragraph={{ rows: 12 }} />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0B0D11]">
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
          description={<Text className="text-gray-400">职位节点已丢失或被移除</Text>}
        >
          <Button type="primary" ghost onClick={() => router.push('/jobs')}>重连至职位库</Button>
        </Empty>
      </div>
    );
  }

  const urgencyColors = {
    low: 'cyan',
    medium: 'gold',
    high: 'volcano',
    urgent: 'magenta'
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
    { value: 'low', label: 'LOW - 常规' },
    { value: 'medium', label: 'MEDIUM - 优先' },
    { value: 'high', label: 'HIGH - 紧急' },
    { value: 'urgent', label: 'URGENT - 特急' }
  ];

  return (
    <div className="min-h-screen bg-[#0B0D11] text-white">
      {/* Premium Hero Banner */}
      <div className="relative h-64 bg-gradient-to-r from-[#6C5CE7]/20 to-[#A29BFE]/5 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-8 h-full flex flex-col justify-end pb-8 relative z-10">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-end justify-between"
          >
            <div>
              <Space className="mb-4">
                <Button 
                  icon={<LeftOutlined />} 
                  ghost 
                  size="small" 
                  className="border-white/20 text-white/60 hover:text-white"
                  onClick={() => router.push('/jobs')}
                />
                <Tag color="#6C5CE7" className="border-none px-3 font-bold uppercase tracking-widest text-[10px]">
                  Job Node
                </Tag>
                <Tag color="black" className="border-white/10 text-white/40 font-mono text-[10px]">
                  ID: {job.id.slice(0, 8)}
                </Tag>
              </Space>
              <Title level={1} className="!text-white !mb-2 !text-4xl font-black tracking-tight">
                {isEditing ? 'Data Reconstruction' : job.title}
              </Title>
              <Space className="text-white/60">
                <Text className="text-white/80 font-bold tracking-wider uppercase text-xs">
                  {job.enterprise?.name || 'GENERIC ENTITY'}
                </Text>
                <Divider type="vertical" className="border-white/10" />
                <Space size={4}>
                  <EnvironmentOutlined className="text-[10px]" />
                  <span className="text-xs uppercase">{job.location || 'REMOTE'}</span>
                </Space>
              </Space>
            </div>

            <div className="flex gap-3">
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div 
                    key="edit-actions"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="flex gap-2"
                  >
                    <Button 
                      className="!bg-white/5 !border-white/10 !text-white hover:!bg-white/10 h-11 px-6 rounded-xl"
                      icon={<CloseOutlined />}
                      onClick={() => {
                        form.setFieldsValue(job);
                        setIsEditing(false);
                      }}
                    >
                      ABORT
                    </Button>
                    <Button 
                      type="primary"
                      className="!bg-[#6C5CE7] !border-none h-11 px-8 rounded-xl font-bold shadow-[0_0_20px_rgba(108,92,231,0.3)]"
                      icon={<SaveOutlined />}
                      loading={saving}
                      onClick={handleSave}
                    >
                      COMMIT CHANGES
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="view-actions"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="flex gap-2"
                  >
                    <Button 
                      className="!bg-white/5 !border-white/10 !text-white hover:!bg-white/10 h-11 px-6 rounded-xl"
                      icon={<EditOutlined />}
                      onClick={() => setIsEditing(true)}
                    >
                      OVERRIDE DATA
                    </Button>
                    <Button 
                      type="primary"
                      className="!bg-white !text-black !border-none h-11 px-8 rounded-xl font-bold"
                      icon={<RobotOutlined />}
                      onClick={() => router.push(`/jobs/${id}/matches`)}
                    >
                      AI NEURAL MATCH
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <Form form={form} layout="vertical" disabled={!isEditing} initialValues={job}>
          <Row gutter={[32, 32]}>
            <Col xs={24} lg={17}>
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
              >
                {/* Requirements Card */}
                <Card 
                  className="!bg-white/[0.02] !border-white/5 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl"
                  title={<span className="text-white font-black uppercase tracking-widest text-xs">Core Requirements</span>}
                >
                  <Form.Item name="requirements" noStyle>
                    <TextArea 
                      rows={12} 
                      className={`!bg-transparent !border-none !text-white/80 !p-0 !text-base leading-relaxed ${isEditing ? '!ring-1 !ring-white/10 !p-4 !rounded-xl !bg-white/5' : ''}`}
                      placeholder="Defining the ideal candidate node..."
                    />
                  </Form.Item>
                </Card>

                {/* Description Card */}
                <Card 
                  className="!bg-white/[0.02] !border-white/5 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl"
                  title={<span className="text-white font-black uppercase tracking-widest text-xs">Job Context & Scope</span>}
                >
                  <Form.Item name="description" noStyle>
                    <TextArea 
                      rows={12} 
                      className={`!bg-transparent !border-none !text-white/70 !p-0 !text-base leading-relaxed ${isEditing ? '!ring-1 !ring-white/10 !p-4 !rounded-xl !bg-white/5' : ''}`}
                      placeholder="Mission parameters and organizational context..."
                    />
                  </Form.Item>
                </Card>
              </motion.div>
            </Col>

            <Col xs={24} lg={7}>
              <motion.div 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-6 sticky top-8"
              >
                {/* Metadata Panel */}
                <Card className="!bg-white/[0.03] !border-white/10 rounded-3xl shadow-2xl">
                  <Title level={5} className="!text-white !mb-6 !text-sm uppercase tracking-widest flex items-center gap-2">
                    <SettingOutlined className="text-[#6C5CE7]" /> System Meta
                  </Title>
                  
                  <div className="space-y-6">
                    <Form.Item name="status" label={<span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Node Status</span>}>
                      <Select 
                        className="premium-select"
                        options={statusOptions} 
                        dropdownClassName="!bg-[#1A1C23] !border-white/10"
                      />
                    </Form.Item>

                    <Form.Item name="urgency" label={<span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Priority Level</span>}>
                      <Select className="premium-select" options={urgencyOptions} />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                      <Form.Item name="salaryMin" label={<span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Min Pay</span>}>
                        <InputNumber 
                          className="!w-full !bg-white/5 !border-white/10 !text-white !rounded-xl" 
                          formatter={value => `${value}K`}
                          parser={value => value!.replace('K', '')}
                        />
                      </Form.Item>
                      <Form.Item name="salaryMax" label={<span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Max Pay</span>}>
                        <InputNumber 
                          className="!w-full !bg-white/5 !border-white/10 !text-white !rounded-xl" 
                          formatter={value => `${value}K`}
                          parser={value => value!.replace('K', '')}
                        />
                      </Form.Item>
                    </div>

                    <Form.Item name="location" label={<span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Location Node</span>}>
                      <Input className="!bg-white/5 !border-white/10 !text-white !rounded-xl !h-10" prefix={<EnvironmentOutlined className="text-white/20" />} />
                    </Form.Item>

                    <Form.Item name="headcount" label={<span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Headcount Capacity</span>}>
                      <InputNumber className="!w-full !bg-white/5 !border-white/10 !text-white !rounded-xl" min={1} />
                    </Form.Item>
                  </div>
                </Card>

                {/* Info Box */}
                <div className="p-6 bg-gradient-to-br from-[#6C5CE7]/10 to-transparent border border-[#6C5CE7]/20 rounded-3xl">
                  <Space className="mb-4">
                    <RocketOutlined className="text-[#6C5CE7] text-xl" />
                    <span className="font-black text-xs uppercase tracking-widest text-[#6C5CE7]">AI Engine Info</span>
                  </Space>
                  <Paragraph className="!text-white/50 !text-xs !mb-0 leading-relaxed">
                    This job node is currently indexed in the neural candidate matching system. 
                    Any changes to requirements will trigger a re-indexing process in the next background cycle.
                  </Paragraph>
                </div>
              </motion.div>
            </Col>
          </Row>
        </Form>
      </div>

      <style jsx global>{`
        .premium-select .ant-select-selector {
          background-color: rgba(255, 255, 255, 0.05) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          color: white !important;
          height: 40px !important;
          display: flex !important;
          align-items: center !important;
        }
        .premium-select .ant-select-selection-item {
          color: white !important;
          font-weight: 600 !important;
        }
        .ant-form-item-label label {
          height: auto !important;
        }
        .ant-input-number-handler-wrap {
          display: none;
        }
      `}</style>
    </div>
  );
}
