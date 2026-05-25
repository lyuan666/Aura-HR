'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import {
  Card,
  Switch,
  Avatar,
  Input,
  Button,
  App,
  Space,
  Divider,
  Skeleton,
  Typography,
  Row,
  Col,
  Tabs,
  Table,
  Tag,
  Modal,
  Descriptions,
  Tooltip,
} from 'antd';
import {
  UserOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  SaveOutlined,
  MailOutlined,
  PhoneOutlined,
  KeyOutlined,
  ImportOutlined,
  RightOutlined,
  TeamOutlined,
  ApiOutlined,
  SyncOutlined,
  PlusOutlined,
  LinkOutlined,
  AuditOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  WechatOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const { Text, Title } = Typography;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role?: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'invited' | 'disabled';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const { message, modal } = App.useApp();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [config, setConfig] = useState<Record<string, boolean>>({});

  // Team members
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamAvailable, setTeamAvailable] = useState(true);

  // Invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('recruiter');
  const [inviteSending, setInviteSending] = useState(false);

  /* ---- Load profile ---- */
  useEffect(() => {
    api
      .get('/auth/profile')
      .then((res) => {
        setProfile(res.data);
      })
      .catch(() => {
        message.error('加载用户信息失败');
      })
      .finally(() => setLoading(false));
  }, [message]);

  /* ---- Load AI / security config ---- */
  useEffect(() => {
    api
      .get('/settings/config')
      .then((res) => {
        setConfig(res.data || {});
      })
      .catch(() => {});
  }, []);

  /* ---- Load team members ---- */
  useEffect(() => {
    setTeamLoading(true);
    api
      .get('/users')
      .then((res) => {
        setTeamMembers(res.data || []);
        setTeamAvailable(true);
      })
      .catch(() => {
        setTeamAvailable(false);
      })
      .finally(() => setTeamLoading(false));
  }, []);

  /* ---- Handlers ---- */

  const handleToggle = useCallback(
    (key: string) => {
      const newValue = !config[key];
      setConfig((prev) => ({ ...prev, [key]: newValue }));
      api
        .put('/settings/config', { [key]: newValue })
        .then(() => {
          message.success(`${key.toUpperCase()} 配置已${newValue ? '开启' : '关闭'}`);
        })
        .catch(() => {
          setConfig((prev) => ({ ...prev, [key]: !newValue }));
          message.error('配置保存失败');
        });
    },
    [config, message],
  );

  const handleSaveProfile = useCallback(() => {
    if (!profile) return;
    setSaving(true);
    api
      .put('/auth/profile', profile)
      .then((res) => {
        setProfile(res.data);
        message.success('个人档案已保存');
      })
      .catch(() => {
        message.error('保存失败');
      })
      .finally(() => setSaving(false));
  }, [profile, message]);

  const handleInviteMember = useCallback(() => {
    if (!inviteEmail.trim()) {
      message.warning('请输入邮箱地址');
      return;
    }
    setInviteSending(true);
    api
      .post('/users/invite', { email: inviteEmail, role: inviteRole })
      .then(() => {
        message.success(`邀请已发送至 ${inviteEmail}`);
        setInviteOpen(false);
        setInviteEmail('');
      })
      .catch(() => {
        message.error('邀请发送失败');
      })
      .finally(() => setInviteSending(false));
  }, [inviteEmail, inviteRole, message]);

  /* ---- Avatar URL helper ---- */
  const getAvatarUrl = (name: string) => {
    if (!name) return undefined;
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
  };

  /* ---- Role tag color mapping ---- */
  const roleTagColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'red';
      case 'manager':
        return 'blue';
      case 'recruiter':
        return 'green';
      default:
        return 'default';
    }
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '管理员';
      case 'manager':
        return '经理';
      case 'recruiter':
        return '猎头顾问';
      default:
        return role;
    }
  };

  const statusTag = (status: string) => {
    switch (status) {
      case 'active':
        return <Tag icon={<CheckCircleOutlined />} color="success">正常</Tag>;
      case 'invited':
        return <Tag icon={<ClockCircleOutlined />} color="processing">已邀请</Tag>;
      case 'disabled':
        return <Tag icon={<CloseCircleOutlined />} color="default">已禁用</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  /* ================================================================ */
  /*  Config items                                                     */
  /* ================================================================ */

  const securityItems = [
    {
      id: 'mfa',
      name: '多重身份验证 (MFA)',
      desc: '为账户增加额外的安全保障层',
      icon: <SafetyCertificateOutlined style={{ fontSize: 20 }} />,
    },
    {
      id: 'auditLog',
      name: '登录审计日志',
      desc: '记录并审计所有 API 请求和登录行为',
      icon: <DatabaseOutlined style={{ fontSize: 20 }} />,
    },
    {
      id: 'apiKey',
      name: 'API 访问令牌',
      desc: '通过加密令牌访问系统核心接口',
      icon: <KeyOutlined style={{ fontSize: 20 }} />,
    },
  ];

  const aiItems = [
    {
      id: 'glm4',
      name: 'GLM-4 增强解析',
      desc: '开启深度语义理解，自动提取简历中的隐藏技能标签',
      icon: <ThunderboltOutlined style={{ fontSize: 20 }} />,
    },
    {
      id: 'deepParse',
      name: '全链路向量空间映射',
      desc: '将候选人与职位库进行 1024 维向量匹配',
      icon: <DatabaseOutlined style={{ fontSize: 20 }} />,
    },
    {
      id: 'autoInvite',
      name: '自动邀约话术生成',
      desc: '根据候选人画像自动生成定制化邀约内容',
      icon: <MailOutlined style={{ fontSize: 20 }} />,
    },
  ];

  /* ================================================================ */
  /*  Tab 1: 个人信息                                                   */
  /* ================================================================ */

  const renderProfileTab = () => {
    if (loading) return <Skeleton active avatar paragraph={{ rows: 4 }} />;
    if (!profile) return null;

    const avatarSrc = profile.avatar || getAvatarUrl(profile.name);

    return (
      <Card>
        <Row gutter={24}>
          <Col span={24}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
              <Tooltip title="头像由 DiceBear 自动生成">
                <Avatar size={80} src={avatarSrc} style={{ backgroundColor: '#1677ff' }}>
                  {profile.name?.[0] || 'U'}
                </Avatar>
              </Tooltip>
              <div>
                <Title level={4} style={{ marginBottom: 4 }}>
                  {profile.name || '未设置'}
                </Title>
                <Text type="secondary">{profile.email}</Text>
                {profile.role && (
                  <div style={{ marginTop: 4 }}>
                    <Tag color={roleTagColor(profile.role)}>{roleLabel(profile.role)}</Tag>
                  </div>
                )}
              </div>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                姓名
              </Text>
              <Input
                value={profile.name || ''}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                邮箱
              </Text>
              <Input
                prefix={<MailOutlined />}
                value={profile.email || ''}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                手机号
              </Text>
              <Input
                prefix={<PhoneOutlined />}
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
          </Col>
        </Row>
        <Divider />
        <div style={{ textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveProfile}
            loading={saving}
          >
            保存更改
          </Button>
        </div>
      </Card>
    );
  };

  /* ================================================================ */
  /*  Tab 2: 团队管理                                                   */
  /* ================================================================ */

  const renderTeamTab = () => {
    const columns = [
      {
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
        render: (name: string, record: TeamMember) => (
          <Space>
            <Avatar size="small" src={getAvatarUrl(name)} style={{ backgroundColor: '#1677ff' }}>
              {name?.[0] || 'U'}
            </Avatar>
            <span>{name || '—'}</span>
          </Space>
        ),
      },
      {
        title: '邮箱',
        dataIndex: 'email',
        key: 'email',
        render: (email: string) => <Text type="secondary">{email}</Text>,
      },
      {
        title: '角色',
        dataIndex: 'role',
        key: 'role',
        render: (role: string) => <Tag color={roleTagColor(role)}>{roleLabel(role)}</Tag>,
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => statusTag(status),
      },
    ];

    if (!teamAvailable) {
      return (
        <Card>
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <TeamOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
            <Title level={4} type="secondary" style={{ marginBottom: 8 }}>
              团队管理功能开发中
            </Title>
            <Text type="secondary">
              团队成员管理 API 尚未就绪，功能上线后即可在此管理您的团队成员。
            </Text>
          </div>
        </Card>
      );
    }

    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <Title level={5} style={{ marginBottom: 4 }}>团队成员</Title>
              <Text type="secondary">管理您的团队成员及其角色权限</Text>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setInviteOpen(true)}
            >
              邀请成员
            </Button>
          </div>
          <Table
            columns={columns}
            dataSource={teamMembers}
            rowKey="id"
            loading={teamLoading}
            pagination={false}
            size="middle"
          />
        </Card>

        <Modal
          title="邀请团队成员"
          open={inviteOpen}
          onCancel={() => {
            setInviteOpen(false);
            setInviteEmail('');
          }}
          onOk={handleInviteMember}
          confirmLoading={inviteSending}
          okText="发送邀请"
          cancelText="取消"
        >
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              邮箱地址
            </Text>
            <Input
              prefix={<MailOutlined />}
              placeholder="请输入被邀请人的邮箱"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              角色
            </Text>
            <Space>
              {(['recruiter', 'manager', 'admin'] as const).map((r) => (
                <Tag
                  key={r}
                  color={inviteRole === r ? roleTagColor(r) : 'default'}
                  style={{ cursor: 'pointer', padding: '4px 12px' }}
                  onClick={() => setInviteRole(r)}
                >
                  {roleLabel(r)}
                </Tag>
              ))}
            </Space>
          </div>
        </Modal>
      </Space>
    );
  };

  /* ================================================================ */
  /*  Tab 3: 通信连接                                                   */
  /* ================================================================ */

  const renderIntegrationsTab = () => {
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {/* 飞书集成 */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space size={16}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fff7e6',
                  color: '#fa8c16',
                }}
              >
                <GlobalOutlined style={{ fontSize: 22 }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>飞书集成</div>
                <Space size={4}>
                  <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 12 }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>未连接</Text>
                </Space>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    连接飞书后可同步日历、消息通知和审批流程
                  </Text>
                </div>
              </div>
            </Space>
            <Button
              icon={<LinkOutlined />}
              onClick={() => message.info('飞书集成功能开发中')}
            >
              连接飞书
            </Button>
          </div>
        </Card>

        {/* 企业微信集成 */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space size={16}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f0f5ff',
                  color: '#1677ff',
                }}
              >
                <WechatOutlined style={{ fontSize: 22 }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>企业微信集成</div>
                <Space size={4}>
                  <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 12 }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>未连接</Text>
                </Space>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    连接企业微信后可同步通讯录和消息推送
                  </Text>
                </div>
              </div>
            </Space>
            <Button
              icon={<LinkOutlined />}
              onClick={() => message.info('企业微信集成功能开发中')}
            >
              连接企业微信
            </Button>
          </div>
        </Card>

        <Card size="small" style={{ background: '#fafafa', borderColor: '#d9d9d9' }}>
          <Space>
            <ApiOutlined style={{ color: '#999' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              更多通信平台集成（钉钉、Slack 等）将在后续版本中陆续开放
            </Text>
          </Space>
        </Card>
      </Space>
    );
  };

  /* ================================================================ */
  /*  Tab 4: 大模型设置                                                 */
  /* ================================================================ */

  const renderAITab = () => {
    return (
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
        {aiItems.map((item) => (
          <Card key={item.id} size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space size={16}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: config[item.id] ? '#e6f4ff' : '#f5f5f5',
                    color: config[item.id] ? '#1677ff' : '#999',
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.desc}
                  </Text>
                </div>
              </Space>
              <Switch checked={!!config[item.id]} onChange={() => handleToggle(item.id)} />
            </div>
          </Card>
        ))}
      </Space>
    );
  };

  /* ================================================================ */
  /*  Tab 5: 安全设置                                                   */
  /* ================================================================ */

  const renderSecurityTab = () => {
    const isAdmin = profile?.role === 'admin';

    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {/* 个人安全设置 */}
        <Card>
          <Title level={5} style={{ marginBottom: 16 }}>个人安全设置</Title>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {securityItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: '#fafafa',
                  borderRadius: 8,
                }}
              >
                <Space size={16}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: config[item.id] ? '#e6f4ff' : '#f0f0f0',
                      color: config[item.id] ? '#1677ff' : '#999',
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.desc}
                    </Text>
                  </div>
                </Space>
                <Switch checked={!!config[item.id]} onChange={() => handleToggle(item.id)} />
              </div>
            ))}
          </Space>
        </Card>

        {/* Admin-only: 系统操作日志 */}
        {isAdmin && (
          <Card>
            <Title level={5} style={{ marginBottom: 16 }}>
              <AuditOutlined style={{ marginRight: 8 }} />
              系统操作日志
            </Title>
            <Descriptions
              bordered
              size="small"
              column={1}
              contentStyle={{ fontSize: 13 }}
              labelStyle={{ fontSize: 13, fontWeight: 500 }}
            >
              <Descriptions.Item label="最近登录">
                <Space>
                  <ClockCircleOutlined />
                  <Text type="secondary">暂无记录</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="最近数据导出">
                <Space>
                  <ClockCircleOutlined />
                  <Text type="secondary">暂无记录</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="最近权限变更">
                <Space>
                  <ClockCircleOutlined />
                  <Text type="secondary">暂无记录</Text>
                </Space>
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                完整操作日志将通过 GET /audit-logs 接口获取，功能开发中
              </Text>
            </div>
          </Card>
        )}

        {/* Admin-only: 全局安全策略 */}
        {isAdmin && (
          <Card>
            <Title level={5} style={{ marginBottom: 16 }}>
              <SettingOutlined style={{ marginRight: 8 }} />
              全局安全策略
            </Title>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: '#fafafa',
                  borderRadius: 8,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>密码策略</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    要求密码包含大小写字母、数字和特殊字符，最少 8 位
                  </Text>
                </div>
                <Tag color="blue">标准模式</Tag>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: '#fafafa',
                  borderRadius: 8,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>会话超时</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    用户无操作超过设定时间后自动登出
                  </Text>
                </div>
                <Tag color="blue">30 分钟</Tag>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: '#fafafa',
                  borderRadius: 8,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>IP 白名单</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    仅允许指定 IP 地址访问系统管理接口
                  </Text>
                </div>
                <Tag color="default">未启用</Tag>
              </div>
            </Space>
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                全局安全策略配置功能开发中，仅管理员可见
              </Text>
            </div>
          </Card>
        )}
      </Space>
    );
  };

  /* ================================================================ */
  /*  Tab 6: 数据同步                                                   */
  /* ================================================================ */

  const renderDataSyncTab = () => {
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {/* 飞书表格同步 */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space size={16}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fff7e6',
                  color: '#fa8c16',
                }}
              >
                <SyncOutlined style={{ fontSize: 20 }} />
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>飞书多维表格同步</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  从飞书多维表格同步候选人数据到系统
                </Text>
                <div style={{ marginTop: 4 }}>
                  <Space size={4}>
                    <ClockCircleOutlined style={{ color: '#999', fontSize: 12 }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>上次同步：尚未同步</Text>
                  </Space>
                </div>
              </div>
            </Space>
            <Button
              icon={<SyncOutlined />}
              onClick={() => message.info('飞书表格同步功能开发中')}
            >
              立即同步
            </Button>
          </div>
        </Card>

        {/* 数据导入 */}
        <Card
          hoverable
          style={{ cursor: 'pointer' }}
          onClick={() => router.push('/imports')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space size={16}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f0f5ff',
                  color: '#1677ff',
                }}
              >
                <ImportOutlined style={{ fontSize: 20 }} />
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>数据导入管理</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Legacy、插件与手工上传进入正式人才库前的审核区，点击进入导入页面
                </Text>
              </div>
            </Space>
            <RightOutlined style={{ color: '#bbb' }} />
          </div>
        </Card>

        <Card size="small" style={{ background: '#fafafa', borderColor: '#d9d9d9' }}>
          <Space direction="vertical" size={4}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              支持从飞书多维表格、Excel 文件等来源同步数据
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              更多数据源（Google Sheets、CSV 等）将在后续版本中支持
            </Text>
          </Space>
        </Card>
      </Space>
    );
  };

  /* ================================================================ */
  /*  Tab items definition                                             */
  /* ================================================================ */

  const tabItems = [
    {
      key: '1',
      label: '个人信息',
      icon: <UserOutlined />,
      children: renderProfileTab(),
    },
    {
      key: '2',
      label: '团队管理',
      icon: <TeamOutlined />,
      children: renderTeamTab(),
    },
    {
      key: '3',
      label: '通信连接',
      icon: <ApiOutlined />,
      children: renderIntegrationsTab(),
    },
    {
      key: '4',
      label: '大模型设置',
      icon: <ThunderboltOutlined />,
      children: renderAITab(),
    },
    {
      key: '5',
      label: '安全设置',
      icon: <SafetyCertificateOutlined />,
      children: renderSecurityTab(),
    },
    {
      key: '6',
      label: '数据同步',
      icon: <SyncOutlined />,
      children: renderDataSyncTab(),
    },
  ];

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

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
