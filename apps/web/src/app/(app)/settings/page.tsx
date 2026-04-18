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
  Divider, 
  message, 
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
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('process');

  const onSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success('配置已成功同步并持久法生效');
    }, 1000);
  };

  // Mock 招聘环节数据
  const initialSteps = [
    { id: 1, name: '简历初筛', type: 'system', locked: true },
    { id: 2, name: '顾问面试', type: 'custom', locked: false },
    { id: 3, name: '客户初试', type: 'custom', locked: false },
    { id: 4, name: '客户复试', type: 'custom', locked: false },
    { id: 5, name: '发送 Offer', type: 'system', locked: true },
    { id: 6, name: '成功入职', type: 'system', locked: true },
  ];

  // 1. 招聘流程配置视图
  const ProcessSettings = () => (
    <div className="space-y-6">
      <Alert 
        message="招聘流程定制" 
        description="您可以根据企业的业务需求自定义招聘漏斗的各个阶段。系统将自动根据这些阶段生成交付看板。" 
        type="info" 
        showIcon 
        className="rounded-xl border-blue-100 bg-blue-50/30"
      />
      
      <div className="bg-white border rounded-2xl overflow-hidden">
        <div className="bg-gray-50/50 px-6 py-4 border-b flex justify-between items-center">
          <span className="text-sm font-bold text-gray-700">标准招聘流程环节</span>
          <Button type="primary" size="small" icon={<PlusOutlined />} className="rounded-lg bg-blue-600 border-none">新增环节</Button>
        </div>
        <div className="p-2">
          {initialSteps.map((step, index) => (
            <div key={step.id} className="group flex items-center p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-move">
              <HolderOutlined className="text-gray-300 mr-4" />
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-xs font-bold mr-4">
                {index + 1}
              </div>
              <div className="flex-1">
                <Text strong className="text-sm">{step.name}</Text>
                {step.locked && <Tag size="small" className="ml-2 scale-90 border-none bg-gray-100 text-gray-400">系统内置</Tag>}
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                 {!step.locked && <Button size="small" type="text" className="text-gray-400 hover:text-blue-500">重命名</Button>}
                 {!step.locked && <Button size="small" type="text" danger>移除</Button>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end pt-4">
         <Button type="primary" onClick={onSave} loading={loading} icon={<SaveOutlined />} className="bg-blue-600 rounded-xl h-10 px-8">保存流程配置</Button>
      </div>
    </div>
  );

  // 2. 团队管理视图
  const TeamSettings = () => (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
          <div>
            <Title level={5}>团队成员 (4/10)</Title>
            <Text type="secondary" className="text-xs">管理您的猎头团队成员及其系统访问权限</Text>
          </div>
          <Button type="primary" className="rounded-lg">邀请成员</Button>
       </div>
       
       <List
          grid={{ gutter: 16, column: 2 }}
          dataSource={[
            { name: 'Franklin Jr.', role: '超级管理员', email: 'franklin@example.com', status: '在线', avatar: 'Felix' },
            { name: '李经理', role: '资深顾问', email: 'li.m@example.com', status: '忙碌', avatar: 'Li' },
            { name: 'Sarah Chen', role: '初级顾问', email: 'sarah.c@example.com', status: '离线', avatar: 'Sarah' },
            { name: '人工智能助手', role: '系统AI', email: 'ai@system.com', status: '全天候', avatar: 'Bot' },
          ]}
          renderItem={(item) => (
            <List.Item>
              <Card className="rounded-2xl border-gray-100 hover:shadow-md transition-shadow">
                 <div className="flex items-start space-x-4">
                    <Avatar src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.avatar}`} size={48} className="border-2 border-white shadow-sm" />
                    <div className="flex-1">
                       <div className="flex justify-between items-center">
                          <Text strong>{item.name}</Text>
                          <Tag className="m-0 border-none bg-blue-50 text-blue-500 text-[10px]">{item.role}</Tag>
                       </div>
                       <div className="text-[11px] text-gray-400 mt-1">{item.email}</div>
                       <div className="mt-3 flex items-center">
                          <div className={cn("w-1.5 h-1.5 rounded-full mr-1.5", item.status === '在线' ? "bg-green-500" : "bg-gray-300")} />
                          <span className="text-[10px] text-gray-500">{item.status}</span>
                       </div>
                    </div>
                 </div>
              </Card>
            </List.Item>
          )}
       />
    </div>
  );

  // 3. AI 解析配置
  const AISettings = () => (
    <Form layout="vertical" onFinish={onSave} className="space-y-6">
       <Alert 
          message="AI 行为增强" 
          description="配置 AI 在解析简历和生成职位匹配报告时的侧重点。这些设定将影响 AI 评分的逻辑。" 
          type="success" 
          showIcon 
          icon={<RobotOutlined />}
          className="rounded-xl border-green-100 bg-green-50/30"
       />
       
       <Row gutter={24}>
          <Col span={12}>
            <Form.Item label={<span className="font-bold">深度解析模式</span>} valuePropName="checked" initialValue={true}>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                 <div>
                    <div className="text-sm font-bold">语义检索增强</div>
                    <div className="text-xs text-gray-400 mt-1">启用后 AI 将深入分析过往项目深度而非仅仅匹配关键词</div>
                 </div>
                 <Switch defaultChecked />
              </div>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={<span className="font-bold">智能匹配加权</span>} initialValue="standard">
               <Select className="h-11 w-full custom-select" defaultValue="standard">
                  <Select.Option value="standard">均衡权重 (默认)</Select.Option>
                  <Select.Option value="edu">名校背景优先</Select.Option>
                  <Select.Option value="company">一线大厂经验优先</Select.Option>
                  <Select.Option value="skill">硬技能匹配优先</Select.Option>
               </Select>
            </Form.Item>
          </Col>
       </Row>

       <Form.Item label={<span className="font-bold text-sm">自定义 AI 提示词偏好 (Prompt Fine-tuning)</span>}>
          <Input.TextArea 
            placeholder="例如：在生成报告时，请重点标注候选人的离职风险，并对频繁跳槽的现象给出批判性分析。" 
            rows={5} 
            className="rounded-2xl border-gray-100 bg-gray-50/50 p-4 text-xs"
          />
       </Form.Item>

       <div className="flex justify-end pt-4">
          <Button type="primary" htmlType="submit" loading={loading} icon={<CheckCircleOutlined />} className="bg-green-600 hover:bg-green-500 border-none rounded-xl h-11 px-10 font-bold shadow-lg shadow-green-100">
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
        <div className="py-10 flex flex-col items-center">
           <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" size={100} className="border-4 border-white shadow-xl mb-6" />
           <Title level={4} className="m-0">Franklin Jr.</Title>
           <Text type="secondary" className="mb-8">超级管理员 · 加入于 2023年10月</Text>
           <div className="w-full max-w-md bg-gray-50 p-6 rounded-2xl border border-gray-100 italic text-gray-400 text-center">
              个人详细信息编辑模块已接入 SSO 统一认证中心，请前往主系统进行修改。
           </div>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <div className="flex items-center mb-1">
             <div className="w-2 h-8 bg-blue-600 rounded-full mr-3" />
             <h1 className="text-3xl font-black text-gray-900 m-0 tracking-tighter">系统偏好设置</h1>
          </div>
          <p className="text-gray-400 text-sm ml-5 font-medium">配置招聘漏斗、团队权限及 AI 解析引擎的核心逻辑</p>
        </div>
      </div>

      <Card variant="borderless" className="mophy-card" styles={{ body: { padding: 0 } }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarExtraContent={
            activeTab !== 'profile' && <Button type="text" className="text-gray-400 hover:text-blue-500 mr-4">恢复默认</Button>
          }
          className="custom-tabs-settings"
          items={tabItems}
          style={{ padding: '24px 32px 32px' }}
        />
      </Card>
    </div>
  );
}
