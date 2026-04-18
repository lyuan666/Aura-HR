'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Card, Tabs, Descriptions, Table, Timeline, Tag, 
  Button, Space, Spin, message, Typography, Divider,
  Breadcrumb, Empty, Modal, Form, Input, Badge, Dropdown,
  Avatar, Checkbox
} from 'antd';
import { 
  ArrowLeftOutlined, BuildOutlined, UserOutlined, 
  HistoryOutlined, SolutionOutlined, EditOutlined,
  GlobalOutlined, EnvironmentOutlined, DownOutlined,
  PlusOutlined, MailOutlined, PhoneOutlined,
  SendOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;

interface Contact {
  id: string;
  name: string;
  title?: string;
  phone?: string;
  email?: string;
  isPrimary: boolean;
  createdAt: string;
}

interface FollowUp {
  id: string;
  content: string;
  createdAt: string;
}

interface EnterpriseDetail {
  id: string;
  name: string;
  industry?: string;
  scale?: string;
  status: string;
  website?: string;
  address?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  contacts?: Contact[];
  followUps?: FollowUp[];
}

export default function EnterpriseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EnterpriseDetail | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);
  const [followUpContent, setFollowUpContent] = useState('');
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    try {
      // 使用相对路径，利用 next.config.ts 中的 rewrites
      const res = await axios.get(`/api/enterprises/${params.id}`);
      setData(res.data);
    } catch (e: unknown) {
      message.error('加载客户详情失败');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await axios.patch(`/api/enterprises/${params.id}/status`, { status: newStatus });
      message.success('状态更新成功');
      fetchData();
    } catch (e: unknown) {
      message.error('状态更新失败');
    }
  };

  const handleAddContact = async () => {
    try {
      const values = await form.validateFields();
      await axios.post(`/api/enterprises/${params.id}/contacts`, values);
      message.success('联系人添加成功');
      setIsContactModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (e: unknown) {
      message.error('添加失败');
    }
  };

  const handleAddFollowUp = async () => {
    if (!followUpContent.trim()) return;
    setSubmittingFollowUp(true);
    try {
      await axios.post('/api/follow-ups', {
        targetType: 'enterprise',
        targetId: params.id,
        content: followUpContent,
      });
      message.success('记录已更新');
      setFollowUpContent('');
      fetchData();
    } catch (e: unknown) {
      message.error('保存失败');
    } finally {
      setSubmittingFollowUp(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <Spin size="large" tip="深度加载中..." />
    </div>
  );
  
  if (!data) return <Empty description="未找到该企业" className="mt-40" />;

  const statusTags: Record<string, { color: string; label: string; dot: string }> = {
    potential: { color: '#94a3b8', label: '潜在客户', dot: '#94a3b8' },
    following: { color: '#3b82f6', label: '跟进中', dot: '#3b82f6' },
    negotiating: { color: '#f59e0b', label: '商务谈判', dot: '#f59e0b' },
    signed: { color: '#10b981', label: '已签约', dot: '#10b981' },
    churned: { color: '#ef4444', label: '已流失', dot: '#ef4444' },
  };

  const statusMenuItems = [
    { key: 'potential', label: '设为潜在客户' },
    { key: 'following', label: '设为跟进中' },
    { key: 'negotiating', label: '设为商务谈判' },
    { key: 'signed', label: '设为已签约' },
    { key: 'churned', label: '设为已流失' },
  ];

  const contactColumns = [
    { 
      title: '姓名与角色', 
      dataIndex: 'name', 
      key: 'name', 
      render: (t: string, r: Contact) => (
        <div className="flex items-center">
          <Avatar size={32} className="bg-indigo-50 text-indigo-500 mr-3 text-xs font-bold">
            {t.charAt(0)}
          </Avatar>
          <div>
            <div className="text-sm font-bold text-slate-800">{t} {r.isPrimary && <Tag color="gold" className="ml-1 text-[10px] scale-90 border-none rounded-full px-2">主</Tag>}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{r.title || '职务暂无'}</div>
          </div>
        </div>
      ) 
    },
    { 
      title: '联系信息', 
      key: 'contact',
      render: (_: any, r: Contact) => (
        <div className="space-y-1">
          <div className="text-xs text-slate-500 flex items-center"><PhoneOutlined className="mr-2 text-[10px]" /> {r.phone || '-'}</div>
          <div className="text-xs text-slate-500 flex items-center"><MailOutlined className="mr-2 text-[10px]" /> {r.email || '-'}</div>
        </div>
      )
    },
    { 
      title: '创建于', 
      dataIndex: 'createdAt', 
      key: 'createdAt', 
      render: (t: string) => (
        <span className="text-xs text-slate-400 font-mono italic">{new Date(t).toLocaleDateString()}</span>
      )
    },
  ];

  const tabItems = [
    {
      key: '1',
      label: <span className="px-2"><BuildOutlined /> 基本档案</span>,
      children: (
        <div className="p-4">
          <Descriptions bordered column={2} className="mophy-descriptions">
            <Descriptions.Item label="企业官方名称" span={2} className="font-bold">{data.name}</Descriptions.Item>
            <Descriptions.Item label="所属行业"><Tag color="processing" className="border-none px-3 rounded-md">{data.industry}</Tag></Descriptions.Item>
            <Descriptions.Item label="人员规模">{data.scale}人</Descriptions.Item>
            <Descriptions.Item label="官方网站" span={2}>
              {data.website ? (
                <a href={data.website} target="_blank" className="text-indigo-600 font-medium hover:underline flex items-center">
                  <GlobalOutlined className="mr-2" /> {data.website}
                </a>
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="办公地址" span={2}>
              <div className="flex items-center text-slate-600">
                <EnvironmentOutlined className="mr-2 text-indigo-400" /> {data.address || '-'}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="企业简介" span={2}>
              <Paragraph className="text-slate-500 text-sm italic leading-relaxed">
                {data.description || '该企业尚未提交背景描述信息，建议从官网采集补充。'}
              </Paragraph>
            </Descriptions.Item>
            <Descriptions.Item label="系统录入时间">{new Date(data.createdAt).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="最近更新">{new Date(data.updatedAt).toLocaleString()}</Descriptions.Item>
          </Descriptions>
        </div>
      ),
    },
    {
      key: '2',
      label: <span className="px-2"><UserOutlined /> 联系人看板 ({data.contacts?.length || 0})</span>,
      children: (
        <div className="p-4">
          <div className="flex justify-between items-center mb-6 px-1">
            <div>
              <Text strong>决策链路资源库</Text>
              <div className="text-[11px] text-slate-400">建立多层级的客户关系网，降低单点流失风险</div>
            </div>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => setIsContactModalOpen(true)}
              className="bg-indigo-600 border-none rounded-lg shadow-md"
            >
              新增联系人
            </Button>
          </div>
          <Table 
            columns={contactColumns} 
            dataSource={data.contacts} 
            rowKey="id" 
            pagination={false} 
            className="mophy-table-small"
          />
        </div>
      ),
    },
    {
      key: '3',
      label: <span className="px-2"><HistoryOutlined /> 协同跟进流</span>,
      children: (
        <div className="p-8">
          <div className="bg-slate-50 rounded-2xl p-6 mb-10 border border-slate-100">
             <div className="text-xs font-black text-slate-400 mb-4 uppercase tracking-widest">录入最新进展</div>
             <Input.TextArea 
                placeholder="在此输入商谈进展、合作意向或备注事项..." 
                rows={3} 
                value={followUpContent}
                onChange={e => setFollowUpContent(e.target.value)}
                className="rounded-xl border-none shadow-sm focus:ring-2 focus:ring-indigo-100 transition-all text-sm mb-4"
             />
             <div className="flex justify-end">
                <Button 
                  type="primary" 
                  icon={<SendOutlined />} 
                  loading={submittingFollowUp}
                  onClick={handleAddFollowUp}
                  className="bg-slate-900 border-none rounded-lg font-bold px-8 shadow-lg shadow-slate-200"
                >
                  发布记录
                </Button>
             </div>
          </div>

          <Timeline
            mode="left"
            className="custom-timeline pl-4"
            items={data.followUps?.length > 0 ? data.followUps.map((f: FollowUp) => ({
              children: (
                <div className="bg-white p-4 rounded-xl border border-slate-50 shadow-sm mb-4 hover:border-indigo-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <Text type="secondary" className="text-[10px] font-mono italic">{new Date(f.createdAt).toLocaleString()}</Text>
                    {f.content.includes('状态') && <Tag color="blue" className="scale-75 origin-right border-none">状态变更</Tag>}
                  </div>
                  <div className="text-slate-700 text-sm leading-relaxed">{f.content}</div>
                </div>
              ),
              dot: f.content.includes('修改为') ? <CheckCircleOutlined className="text-indigo-500" /> : undefined,
              color: f.content.includes('修改为') ? 'blue' : 'gray'
            })) : [{ children: <div className="text-slate-300 py-10">尚无任何跟进记录</div> }]}
          />
        </div>
      ),
    },
    {
      key: '4',
      label: <span className="px-2"><SolutionOutlined /> 招聘矩阵</span>,
      children: (
        <div className="flex flex-col items-center justify-center py-32 opacity-30">
           <SolutionOutlined className="text-6xl mb-6" />
           <Text strong className="text-xl">岗位需求模块正在同步中</Text>
           <Text type="secondary" className="mt-2">通过大数据自动关联该企业的最新招聘需求</Text>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Breadcrumb className="mb-8 px-2">
        <Breadcrumb.Item>
           <Text type="secondary" onClick={() => router.push('/enterprises')} className="cursor-pointer hover:text-indigo-600 transition-colors flex items-center">
             <ArrowLeftOutlined className="mr-2" /> 协作客户中心
           </Text>
        </Breadcrumb.Item>
        <Breadcrumb.Item className="font-bold text-slate-800">档案详情</Breadcrumb.Item>
      </Breadcrumb>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* 左侧侧边栏：核心画像 */}
        <div className="lg:col-span-1">
          <Card 
            className="rounded-3xl border-none shadow-xl shadow-indigo-50/50 sticky top-8 overflow-hidden"
            styles={{ body: { padding: 0 } }}
          >
            <div className="h-24 bg-gradient-to-br from-indigo-500 to-violet-600 relative">
               <div className="absolute -bottom-8 left-8 p-1 bg-white rounded-2xl shadow-lg ring-4 ring-indigo-50">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center font-black text-2xl uppercase">
                     {data.name.charAt(0)}
                  </div>
               </div>
            </div>
            
            <div className="px-8 pt-12 pb-8">
              <Title level={4} className="m-0 mb-2 truncate" title={data.name}>{data.name}</Title>
              <div className="flex items-center space-x-2 mb-6">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: statusTags[data.status]?.dot }} 
                />
                <Text className="text-xs font-bold" style={{ color: statusTags[data.status]?.color }}>
                   {statusTags[data.status]?.label}
                </Text>
              </div>

              <Divider className="my-6 border-slate-50" />

              <div className="space-y-6">
                 <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-widest">Industry</div>
                    <Text strong className="text-sm block">{data.industry}</Text>
                 </div>
                 <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-widest">Scale</div>
                    <Text strong className="text-sm block">{data.scale}人</Text>
                 </div>
                 <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-widest">Controls</div>
                    <div className="flex flex-col space-y-3 mt-4">
                       <Dropdown menu={{ items: statusMenuItems, onClick: (e) => handleStatusChange(e.key) }}>
                          <Button block className="rounded-xl border-slate-200 h-10 text-xs font-bold text-slate-600 flex justify-between items-center group">
                             修改业务状态 <DownOutlined className="text-[10px] group-hover:translate-y-0.5 transition-transform" />
                          </Button>
                       </Dropdown>
                       <Button block type="primary" icon={<EditOutlined />} className="rounded-xl bg-indigo-600 border-none h-10 text-xs font-bold shadow-lg shadow-indigo-100">
                          快速编辑档案
                       </Button>
                    </div>
                 </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 右侧主内容：详情与动态 */}
        <div className="lg:col-span-3">
          <Card className="rounded-3xl border-none shadow-xl shadow-indigo-50/50 min-h-[600px] overflow-hidden">
            <Tabs 
              defaultActiveKey="1" 
              items={tabItems} 
              className="custom-tabs"
              styles={{ tabPane: { padding: '8px' } }}
            />
          </Card>
        </div>
      </div>

      <Modal
        title={
          <div className="flex items-center py-1">
            <UserOutlined className="text-indigo-500 mr-2" />
            <span className="font-bold">新增主要/辅助联系人</span>
          </div>
        }
        open={isContactModalOpen}
        onOk={handleAddContact}
        onCancel={() => setIsContactModalOpen(false)}
        okText="确认添加"
        cancelText="取消"
        className="modern-modal"
        centered
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="name" label={<span className="text-xs font-bold text-slate-500">姓名</span>} rules={[{ required: true, message: '请输入姓名' }]}>
            <Input className="h-10 rounded-lg" placeholder="姓名" />
          </Form.Item>
          <Form.Item name="title" label={<span className="text-xs font-bold text-slate-500">职务</span>}>
            <Input className="h-10 rounded-lg" placeholder="项目经理 / HRD" />
          </Form.Item>
          <Form.Item name="phone" label={<span className="text-xs font-bold text-slate-500">手机号</span>}>
            <Input className="h-10 rounded-lg" placeholder="联系电话" />
          </Form.Item>
          <Form.Item name="email" label={<span className="text-xs font-bold text-slate-500">邮箱</span>}>
            <Input className="h-10 rounded-lg" placeholder="Email 地址" />
          </Form.Item>
          <Form.Item name="isPrimary" valuePropName="checked" className="mt-4 mb-0">
            <Checkbox className="text-xs text-slate-600 font-medium">设为该企业的核心主协助/对接人</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
