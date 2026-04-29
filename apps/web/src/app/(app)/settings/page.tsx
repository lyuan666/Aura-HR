'use client';

import React, { useState, useEffect } from 'react';
import { PageContainer, ProForm, ProFormText } from '@ant-design/pro-components';
import {
  Card, Switch, Avatar, Input, Button, App, Space, Divider, Skeleton,
  Typography, Row, Col, Tabs,
} from 'antd';
import {
  UserOutlined,
  SafetyCertificateOutlined,
  BellOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  SaveOutlined,
  CameraOutlined,
  MailOutlined,
  PhoneOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import api from '@/lib/api';

const { Text, Title, Paragraph } = Typography;

export default function SettingsPage() {
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ name: string; email: string; phone?: string; avatar?: string } | null>(null);
  const [config, setConfig] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.get('/auth/profile').then(res => {
      setProfile(res.data);
    }).catch(() => {
      message.error('加载用户信息失败');
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get('/settings/config').then(res => {
      setConfig(res.data || {});
    }).catch(() => {});
  }, []);

  const handleToggle = (key: string) => {
    const newValue = !config[key];
    setConfig(prev => ({ ...prev, [key]: newValue }));
    api.put('/settings/config', { [key]: newValue }).then(() => {
      message.success(`${key.toUpperCase()} 配置已${newValue ? '开启' : '关闭'}`);
    }).catch(() => {
      setConfig(prev => ({ ...prev, [key]: !newValue }));
      message.error('配置保存失败');
    });
  };

  const handleSaveProfile = () => {
    if (!profile) return;
    setSaving(true);
    api.put('/auth/profile', profile).then(() => {
      message.success('个人档案已保存');
    }).catch(() => {
      message.error('保存失败');
    }).finally(() => setSaving(false));
  };

  const securityItems = [
    { id: 'mfa', name: '多重身份验证 (MFA)', desc: '为账户增加额外的安全保障层', icon: <SafetyCertificateOutlined style={{ fontSize: 20 }} /> },
    { id: 'auditLog', name: '登录审计日志', desc: '记录并审计所有 API 请求和登录行为', icon: <DatabaseOutlined style={{ fontSize: 20 }} /> },
    { id: 'apiKey', name: 'API 访问令牌', desc: '通过加密令牌访问系统核心接口', icon: <KeyOutlined style={{ fontSize: 20 }} /> },
  ];

  const aiItems = [
    { id: 'glm4', name: 'GLM-4 增强解析', desc: '开启深度语义理解，自动提取简历中的隐藏技能标签', icon: <ThunderboltOutlined style={{ fontSize: 20 }} /> },
    { id: 'deepParse', name: '全链路向量空间映射', desc: '将候选人与职位库进行 1024 维向量匹配', icon: <DatabaseOutlined style={{ fontSize: 20 }} /> },
    { id: 'autoInvite', name: '自动邀约话术生成', desc: '根据候选人画像自动生成定制化邀约内容', icon: <MailOutlined style={{ fontSize: 20 }} /> },
  ];

  const tabItems = [
    {
      key: '1',
      label: '个人档案',
      icon: <UserOutlined />,
      children: loading ? (
        <Skeleton active avatar paragraph={{ rows: 4 }} />
      ) : profile ? (
        <Card>
          <Row gutter={24}>
            <Col span={24}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
                <div style={{ position: 'relative' }}>
                  <Avatar size={80} src={profile.avatar} style={{ backgroundColor: '#1677ff' }}>
                    {profile.name?.[0] || 'U'}
                  </Avatar>
                </div>
                <div>
                  <Title level={4} style={{ marginBottom: 4 }}>{profile.name || '未设置'}</Title>
                  <Text type="secondary">{profile.email}</Text>
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>姓名</Text>
                <Input
                  defaultValue={profile.name || ''}
                  onChange={e => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>邮箱</Text>
                <Input
                  prefix={<MailOutlined />}
                  defaultValue={profile.email || ''}
                  onChange={e => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>手机号</Text>
                <Input
                  prefix={<PhoneOutlined />}
                  defaultValue={profile.phone || ''}
                  onChange={e => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
            </Col>
          </Row>
          <Divider />
          <div style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveProfile} loading={saving}>
              保存更改
            </Button>
          </div>
        </Card>
      ) : null,
    },
    {
      key: '2',
      label: '安全设置',
      icon: <SafetyCertificateOutlined />,
      children: (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {securityItems.map(item => (
            <Card key={item.id} size="small">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space size={16}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: config[item.id] ? '#e6f4ff' : '#f5f5f5',
                    color: config[item.id] ? '#1677ff' : '#999',
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.desc}</Text>
                  </div>
                </Space>
                <Switch checked={!!config[item.id]} onChange={() => handleToggle(item.id)} />
              </div>
            </Card>
          ))}
        </Space>
      ),
    },
    {
      key: '3',
      label: 'AI 配置',
      icon: <ThunderboltOutlined />,
      children: (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Card size="small" style={{ background: '#f0f5ff', borderColor: '#adc6ff' }}>
            <Space>
              <ThunderboltOutlined style={{ color: '#1677ff', fontSize: 18 }} />
              <div>
                <div style={{ fontWeight: 600 }}>底层 AI 算力节点已连接</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  当前正在使用 GLM-4 视觉解析引擎与专用人才向量空间
                </Text>
              </div>
            </Space>
          </Card>
          {aiItems.map(item => (
            <Card key={item.id} size="small">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space size={16}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: config[item.id] ? '#e6f4ff' : '#f5f5f5',
                    color: config[item.id] ? '#1677ff' : '#999',
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.desc}</Text>
                  </div>
                </Space>
                <Switch checked={!!config[item.id]} onChange={() => handleToggle(item.id)} />
              </div>
            </Card>
          ))}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: '系统设置',
        subTitle: '全局配置与参数优化',
      }}
    >
      <Tabs items={tabItems} />
    </PageContainer>
  );
}
