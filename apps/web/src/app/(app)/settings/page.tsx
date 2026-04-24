'use client';

import React, { useState } from 'react';
import {
  Card,
  Tabs,
  Typography,
  Form,
  Input,
  Button,
  Switch,
  List,
  Avatar,
  Tag,
  Space,
  App,
  Alert,
  Select,
  Row,
  Col
} from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  TeamOutlined,
  RobotOutlined,
  PlusOutlined,
  HolderOutlined,
  SaveOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { cn } from '@/lib/utils';

const { Title, Text, Paragraph } = Typography;

export default function SettingsPage() {
  const { message: antMessage } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('process');

  const onSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      antMessage.success('配置已成功保存');
    }, 1000);
  };

  const initialSteps = [
    { id: 1, name: '简历初筛', type: 'system', locked: true },
    { id: 2, name: '顾问面试', type: 'custom', locked: false },
    { id: 3, name: '客户初试', type: 'custom', locked: false },
    { id: 4, name: '客户复试', type: 'custom', locked: false },
    { id: 5, name: '发送 Offer', type: 'system', locked: true },
    { id: 6, name: '成功入职', type: 'system', locked: true },
  ];

  const ProcessSettings = () => (
    <div className="space-y-5">
      <Alert
        message="招聘流程定制"
        description="您可以根据企业的业务需求自定义招聘漏斗的各个阶段。系统将自动根据这些阶段生成交付看板。"
        type="info"
        showIcon
        className="rounded-[12px]"
      />

      <div className="bg-white rounded-[16px] overflow-hidden shadow-sm">
        <div className="bg-[#F2F2F7] px-5 py-3 border-b border-[#F2F2F7] flex justify-between items-center">
          <span className="text-sm font-medium text-[#1D1D1F]">标准招聘流程环节</span>
          <Button type="primary" size="small" icon={<PlusOutlined />} className="rounded-[8px]">新增环节</Button>
        </div>
        <div className="p-2">
          {initialSteps.map((step, index) => (
            <div key={step.id} className="group flex items-center p-3 hover:bg-[#F2F2F7] rounded-[10px] transition-colors cursor-move">
              <HolderOutlined className="text-[#C7C7CC] mr-3" />
              <div className="w-7 h-7 rounded-full bg-[#007AFF]/[0.08] text-[#007AFF] flex items-center justify-center text-xs font-medium mr-3">
                {index + 1}
              </div>
              <div className="flex-1">
                <Text className="text-sm font-medium text-[#1D1D1F]">{step.name}</Text>
                {step.locked && <Tag style={{ background: '#F2F2F7', color: '#8E8E93', border: 'none', borderRadius: 6, marginLeft: 8, fontSize: 10 }}>系统内置</Tag>}
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                {!step.locked && <Button size="small" type="text" className="text-[#8E8E93] hover:text-[#007AFF]">重命名</Button>}
                {!step.locked && <Button size="small" type="text" danger>移除</Button>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end pt-3">
        <Button type="primary" onClick={onSave} loading={loading} icon={<SaveOutlined />} className="rounded-[10px] h-10 px-8">保存流程配置</Button>
      </div>
    </div>
  );

  const TeamSettings = () => (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <Title level={5} className="m-0 text-[#1D1D1F]">团队成员 (4/10)</Title>
          <Text className="text-[#8E8E93] text-xs">管理您的猎头团队成员及其系统访问权限</Text>
        </div>
        <Button type="primary" className="rounded-[10px]">邀请成员</Button>
      </div>

      <List
        grid={{ gutter: 16, column: 2 }}
        dataSource={[
          { name: 'Franklin Jr.', role: '超级管理员', email: 'franklin@example.com', status: '在线' },
          { name: '李经理', role: '资深顾问', email: 'li.m@example.com', status: '忙碌' },
          { name: 'Sarah Chen', role: '初级顾问', email: 'sarah.c@example.com', status: '离线' },
          { name: '人工智能助手', role: '系统AI', email: 'ai@system.com', status: '全天候' },
        ]}
        renderItem={(item) => (
          <List.Item>
            <Card className="rounded-[16px] border-none shadow-sm">
              <div className="flex items-start space-x-3">
                <Avatar size={44} style={{ backgroundColor: '#007AFF', fontWeight: 500, fontSize: 16 }}>{item.name?.[0] || '?'}</Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <Text className="font-medium text-[#1D1D1F]">{item.name}</Text>
                    <Tag style={{ background: 'rgba(0,122,255,0.06)', color: '#007AFF', border: 'none', borderRadius: 8, fontSize: 10, fontWeight: 500 }}>{item.role}</Tag>
                  </div>
                  <div className="text-[11px] text-[#8E8E93] mt-1">{item.email}</div>
                  <div className="mt-2 flex items-center">
                    <div className={cn("w-1.5 h-1.5 rounded-full mr-1.5", item.status === '在线' ? "bg-[#34C759]" : "bg-[#C7C7CC]")} />
                    <span className="text-[10px] text-[#8E8E93]">{item.status}</span>
                  </div>
                </div>
              </div>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );

  const AISettings = () => (
    <Form layout="vertical" onFinish={onSave} className="space-y-5">
      <Alert
        message="AI 行为增强"
        description="配置 AI 在解析简历和生成职位匹配报告时的侧重点。这些设定将影响 AI 评分的逻辑。"
        type="success"
        showIcon
        icon={<RobotOutlined />}
        className="rounded-[12px]"
      />

      <Row gutter={24}>
        <Col span={12}>
          <Form.Item label={<span className="font-medium text-[#1D1D1F]">深度解析模式</span>} valuePropName="checked" initialValue={true}>
            <div className="flex items-center justify-between p-4 bg-[#F2F2F7] rounded-[12px]">
              <div>
                <div className="text-sm font-medium text-[#1D1D1F]">语义检索增强</div>
                <div className="text-xs text-[#8E8E93] mt-1">启用后 AI 将深入分析过往项目深度而非仅仅匹配关键词</div>
              </div>
              <Switch defaultChecked />
            </div>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label={<span className="font-medium text-[#1D1D1F]">智能匹配加权</span>} initialValue="standard">
            <Select className="h-10 w-full" defaultValue="standard">
              <Select.Option value="standard">均衡权重 (默认)</Select.Option>
              <Select.Option value="edu">名校背景优先</Select.Option>
              <Select.Option value="company">一线大厂经验优先</Select.Option>
              <Select.Option value="skill">硬技能匹配优先</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label={<span className="font-medium text-[#1D1D1F] text-sm">自定义 AI 提示词偏好</span>}>
        <Input.TextArea
          placeholder="例如：在生成报告时，请重点标注候选人的离职风险，并对频繁跳槽的现象给出批判性分析。"
          rows={5}
          className="rounded-[12px] bg-[#F2F2F7] p-3 text-xs"
        />
      </Form.Item>

      <div className="flex justify-end pt-3">
        <Button type="primary" htmlType="submit" loading={loading} icon={<CheckCircleOutlined />} className="rounded-[10px] h-10 px-10">
          更新 AI 解析策略
        </Button>
      </div>
    </Form>
  );

  const tabItems = [
    {
      key: 'process',
      label: <Space><SettingOutlined />招聘流程</Space>,
      children: <ProcessSettings />,
    },
    {
      key: 'team',
      label: <Space><TeamOutlined />团队管理</Space>,
      children: <TeamSettings />,
    },
    {
      key: 'ai',
      label: <Space><RobotOutlined />AI 策略配置</Space>,
      children: <AISettings />,
    },
    {
      key: 'profile',
      label: <Space><UserOutlined />个人中心</Space>,
      children: (
        <div className="py-8 flex flex-col items-center">
          <Avatar size={80} style={{ backgroundColor: '#007AFF', fontSize: 28, fontWeight: 500 }} className="mb-5">F</Avatar>
          <Title level={4} className="m-0 text-[#1D1D1F]">Franklin Jr.</Title>
          <Text className="text-[#8E8E93] mb-6">超级管理员 · 加入于 2023年10月</Text>
          <div className="w-full max-w-md bg-[#F2F2F7] p-5 rounded-[12px] text-center">
            <Text className="text-[#8E8E93] text-sm">
              个人详细信息编辑模块已接入 SSO 统一认证中心，请前往主系统进行修改。
            </Text>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1D1D1F] m-0 tracking-tight">系统偏好设置</h1>
          <p className="text-[#8E8E93] text-xs mt-1">配置招聘漏斗、团队权限及 AI 解析引擎的核心逻辑</p>
        </div>
      </div>

      <Card variant="borderless" className="rounded-[20px] shadow-sm" styles={{ body: { padding: 0 } }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarExtraContent={
            activeTab !== 'profile' && <Button type="text" className="text-[#8E8E93] hover:text-[#007AFF] mr-4">恢复默认</Button>
          }
          items={tabItems}
          style={{ padding: '20px 28px 28px' }}
        />
      </Card>
    </div>
  );
}
