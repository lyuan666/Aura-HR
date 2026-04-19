'use client';

import React, { useEffect, useState } from 'react';
import { Button, Table, Input, Space, Tag, Modal, Form, Select, message, Typography, Row, Col, Card, Badge, Avatar } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, BankOutlined } from '@ant-design/icons';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

interface Enterprise {
  id: string;
  name: string;
  industry?: string;
  scale?: string;
  status: string;
  contactName?: string;
  updatedAt: string;
}

export default function EnterprisesPage() {
  const [data, setData] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();

  const fetchEnterprises = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/enterprises');
      setData(res.data);
    } catch (e: unknown) {
      if (e instanceof Error && !e.message?.includes('Network Error')) {
        // 静默处理，避免干扰演示
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnterprises();
  }, [fetchEnterprises]);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await api.post('/enterprises', values);
      message.success('创建成功');
      setIsModalOpen(false);
      form.resetFields();
      fetchEnterprises();
    } catch (e) {
      console.error(e);
    }
  };

  const columns = [
    { 
      title: '企业与客户', 
      dataIndex: 'name', 
      key: 'name',
      render: (text: string, record: Enterprise) => (
        <div 
          className="flex items-center cursor-pointer group" 
          onClick={() => router.push(`/enterprises/${record.id}`)}
        >
          <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center mr-3 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm">
            <BankOutlined className="text-lg" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{text}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{record.industry || '通用行业'} · {record.scale || '规模未知'}</div>
          </div>
        </div>
      )
    },
    {
      title: '商务状态',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string) => {
        const config: Record<string, { color: string, label: string }> = {
          potential: { color: '#94a3b8', label: '潜在客户' }, 
          following: { color: '#3b82f6', label: '跟进中' },
          negotiating: { color: '#f59e0b', label: '商务谈判' }, 
          signed: { color: '#10b981', label: '已签约' }, 
          churned: { color: '#ef4444', label: '已流失' },
        };
        const item = config[status] || config.potential;
        return (
          <div className="flex items-center">
            <Badge color={item.color} className="mr-2" />
            <span className="text-xs font-medium" style={{ color: item.color }}>{item.label}</span>
          </div>
        );
      },
    },
    { 
      title: '核心联系人', 
      dataIndex: 'contactName', 
      key: 'contactName',
      render: (name: string) => (
        <div className="flex items-center text-xs text-gray-600 font-medium">
          <Avatar size={24} className="bg-indigo-100 text-indigo-600 mr-2 text-[10px]">{name?.charAt(0) || 'U'}</Avatar>
          {name || '尚未绑定'}
        </div>
      )
    },
    { 
      title: '更新于', 
      dataIndex: 'updatedAt', 
      key: 'updatedAt',
      width: 180,
      render: (t: string) => (
        <Text className="text-xs text-slate-400 font-mono italic">
          {new Date(t).toLocaleDateString()}
        </Text>
      )
    },
  ];

  return (
    <div className="p-8">
      <Row justify="space-between" align="bottom" className="mb-10">
        <Col>
          <div className="flex items-center mb-1">
             <div className="w-2 h-8 bg-indigo-600 rounded-full mr-3" />
             <h1 className="text-3xl font-black text-gray-900 m-0 tracking-tighter">企业/客户中心</h1>
          </div>
          <p className="text-gray-400 text-sm ml-5">管理核心招聘合作伙伴，建立长期稳定的商务协作关系</p>
        </Col>
        <Col>
          <Space size={16}>
             <div className="flex items-center bg-gray-100/50 p-1 rounded-2xl border border-gray-100">
                <Input 
                  variant="borderless" 
                  prefix={<SearchOutlined className="text-gray-400" />} 
                  placeholder="搜索企业或决策人..." 
                  className="w-64 h-10 text-xs" 
                />
             </div>
             <Button 
                type="primary" 
                size="large"
                icon={<PlusOutlined />} 
                onClick={() => setIsModalOpen(true)}
                className="h-12 px-8 rounded-2xl bg-indigo-600 border-none shadow-xl shadow-indigo-100 hover:scale-105 transition-transform font-bold"
             >
                拓展新客户
             </Button>
          </Space>
        </Col>
      </Row>

      <Card variant="borderless" className="mophy-card" styles={{ body: { padding: '12px' } }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: false,
            className: "pr-4"
          }}
          className="custom-table"
          locale={{ 
            emptyText: (
              <div className="py-20 flex flex-col items-center">
                 <BankOutlined className="text-5xl text-gray-100 mb-4" />
                 <Text type="secondary" className="text-xs">暂无企业数据，点击上方按钮开始您的业务拓展</Text>
              </div>
            )
          }}
        />
      </Card>

      <Modal
        title={
          <div className="flex items-center py-2">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center mr-3">
              <PlusOutlined className="text-lg" />
            </div>
            <div>
              <div className="text-base font-bold">录入新合作伙伴</div>
              <div className="text-[11px] text-gray-400 font-normal">建立企业档案，启动深度人才寻访项目</div>
            </div>
          </div>
        }
        open={isModalOpen}
        onOk={handleCreate}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalOpen(false)} className="rounded-lg h-10 px-6">取消</Button>,
          <Button key="ok" type="primary" onClick={handleCreate} className="rounded-lg h-10 px-8 bg-indigo-600 border-none shadow-md">保存并同步</Button>
        ]}
        width={640}
        centered
        className="modern-modal"
      >
        <Form form={form} layout="vertical" className="mt-6">
          <Form.Item name="name" label={<span className="text-xs font-bold text-gray-500">企业名称</span>} rules={[{ required: true, message: '请输入企业名称' }]}>
            <Input placeholder="输入全称，例如：字节跳动（中国）有限公司" className="h-11 rounded-xl" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="industry" label={<span className="text-xs font-bold text-gray-500">所属行业</span>}>
                <Input placeholder="互联网 / AI / 芯片" className="h-11 rounded-xl" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="scale" label={<span className="text-xs font-bold text-gray-500">人员规模</span>}>
                <Select placeholder="请选择规模" className="h-11 w-full custom-select">
                  <Select.Option value="0-20">0-20人 (初创团队)</Select.Option>
                  <Select.Option value="20-99">20-99人 (成长期)</Select.Option>
                  <Select.Option value="100-499">100-499人 (中型企业)</Select.Option>
                  <Select.Option value="500+">500人及以上 (大型集团)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <div className="mt-4 p-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
             <div className="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">关键决策人</div>
             <Row gutter={16}>
               <Col span={12}>
                 <Form.Item name="contactName" label={<span className="text-[10px] text-slate-400">对接人姓名</span>}>
                   <Input placeholder="HRD / VP" className="border-none bg-white rounded-lg h-9 shadow-sm" />
                 </Form.Item>
               </Col>
               <Col span={12}>
                 <Form.Item name="contactPhone" label={<span className="text-[10px] text-slate-400">联系信息</span>}>
                   <Input placeholder="手机号或邮箱" className="border-none bg-white rounded-lg h-9 shadow-sm" />
                 </Form.Item>
               </Col>
             </Row>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

