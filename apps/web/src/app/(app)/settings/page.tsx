'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Switch,
  Avatar,
  Input,
  Button,
  App,
  Space,
  Skeleton,
  Typography,
  Tag,
  Modal,
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
/*  Color constants                                                    */
/* ------------------------------------------------------------------ */

const COLORS = {
  primary: '#1677ff',
  primaryBg: '#e6f4ff',
  primaryBgHover: '#f0f5ff',
  bg: '#ffffff',
  text: '#1f1f1f',
  textSecondary: '#666666',
  textAux: '#999999',
  border: '#f0f0f0',
  borderMenu: '#e8e8e8',
  inputBg: '#fafafa',
  gradientStart: '#1677ff',
  gradientEnd: '#69b1ff',
};

/* ------------------------------------------------------------------ */
/*  Menu items                                                         */
/* ------------------------------------------------------------------ */

const MENU_ITEMS = [
  { key: 'profile', label: '个人信息', icon: UserOutlined },
  { key: 'team', label: '团队管理', icon: TeamOutlined },
  { key: 'integrations', label: '通信连接', icon: ApiOutlined },
  { key: 'ai', label: '大模型设置', icon: ThunderboltOutlined },
  { key: 'security', label: '安全设置', icon: SafetyCertificateOutlined },
  { key: 'sync', label: '数据同步', icon: SyncOutlined },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const { message, modal } = App.useApp();
  const router = useRouter();

  /* ---- Active menu ---- */
  const [activeMenu, setActiveMenu] = useState('profile');

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
  /*  Section: 个人信息                                                 */
  /* ================================================================ */

  const renderProfileSection = () => {
    if (loading) return <Skeleton active avatar paragraph={{ rows: 4 }} />;
    if (!profile) return null;

    const avatarSrc = profile.avatar || getAvatarUrl(profile.name);

    return (
      <div>
        {/* Section header */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.text, margin: 0 }}>
            个人信息
          </h2>
          <p style={{ fontSize: 14, color: COLORS.textSecondary, margin: '4px 0 0' }}>
            管理您的个人资料与账户信息
          </p>
        </div>

        {/* Avatar + Name area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 36 }}>
          <Tooltip title="头像由 DiceBear 自动生成">
            <Avatar
              size={96}
              src={avatarSrc}
              style={{ backgroundColor: COLORS.primary, flexShrink: 0 }}
            >
              {profile.name?.[0] || 'U'}
            </Avatar>
          </Tooltip>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>
              {profile.name || '未设置'}
            </div>
            <div style={{ fontSize: 14, color: COLORS.textSecondary, marginBottom: 6 }}>
              {profile.email}
            </div>
            {profile.role && (
              <Tag color={roleTagColor(profile.role)} style={{ margin: 0 }}>
                {roleLabel(profile.role)}
              </Tag>
            )}
          </div>
        </div>

        {/* Form fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px', marginBottom: 32 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: COLORS.textSecondary, marginBottom: 6, fontWeight: 500 }}>
              姓名
            </label>
            <Input
              value={profile.name || ''}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              style={{ background: COLORS.inputBg, borderColor: COLORS.border }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: COLORS.textSecondary, marginBottom: 6, fontWeight: 500 }}>
              邮箱
            </label>
            <Input
              prefix={<MailOutlined style={{ color: COLORS.textAux }} />}
              value={profile.email || ''}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              style={{ background: COLORS.inputBg, borderColor: COLORS.border }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: COLORS.textSecondary, marginBottom: 6, fontWeight: 500 }}>
              手机号
            </label>
            <Input
              prefix={<PhoneOutlined style={{ color: COLORS.textAux }} />}
              value={profile.phone || ''}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              style={{ background: COLORS.inputBg, borderColor: COLORS.border }}
            />
          </div>
        </div>

        {/* Save button */}
        <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveProfile}
            loading={saving}
            style={{ borderRadius: 6, height: 36, paddingLeft: 24, paddingRight: 24 }}
          >
            保存修改
          </Button>
        </div>
      </div>
    );
  };

  /* ================================================================ */
  /*  Section: 团队管理                                                 */
  /* ================================================================ */

  const renderTeamSection = () => {
    /* Empty state */
    if (!teamAvailable) {
      return (
        <div>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.text, margin: 0 }}>
              团队管理
            </h2>
            <p style={{ fontSize: 14, color: COLORS.textSecondary, margin: '4px 0 0' }}>
              管理您的团队成员及其角色权限
            </p>
          </div>
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <TeamOutlined style={{ fontSize: 56, color: '#d9d9d9', marginBottom: 20, display: 'block' }} />
            <div style={{ fontSize: 16, fontWeight: 500, color: COLORS.textSecondary, marginBottom: 8 }}>
              团队管理功能开发中
            </div>
            <div style={{ fontSize: 14, color: COLORS.textAux, maxWidth: 360, margin: '0 auto' }}>
              团队成员管理 API 尚未就绪，功能上线后即可在此管理您的团队成员。
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        {/* Section header + invite button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.text, margin: 0 }}>
              团队管理
            </h2>
            <p style={{ fontSize: 14, color: COLORS.textSecondary, margin: '4px 0 0' }}>
              管理您的团队成员及其角色权限
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setInviteOpen(true)}
            style={{ borderRadius: 6, height: 36 }}
          >
            邀请成员
          </Button>
        </div>

        {/* Member list */}
        {teamLoading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {teamMembers.map((member) => (
              <div
                key={member.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: `1px solid ${COLORS.border}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar
                    size={36}
                    src={getAvatarUrl(member.name)}
                    style={{ backgroundColor: COLORS.primary, flexShrink: 0 }}
                  >
                    {member.name?.[0] || 'U'}
                  </Avatar>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.text }}>
                      {member.name || '—'}
                    </div>
                    <div style={{ fontSize: 13, color: COLORS.textAux }}>{member.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Tag color={roleTagColor(member.role)}>{roleLabel(member.role)}</Tag>
                  {statusTag(member.status)}
                </div>
              </div>
            ))}
            {teamMembers.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: COLORS.textAux }}>
                暂无团队成员
              </div>
            )}
          </div>
        )}

        {/* Invite modal */}
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
      </div>
    );
  };

  /* ================================================================ */
  /*  Section: 通信连接                                                 */
  /* ================================================================ */

  const renderIntegrationsSection = () => {
    const integrations = [
      {
        key: 'feishu',
        name: '飞书集成',
        desc: '连接飞书后可同步日历、消息通知和审批流程',
        icon: <GlobalOutlined style={{ fontSize: 22 }} />,
        iconBg: '#fff7e6',
        iconColor: '#fa8c16',
        connected: false,
        btnLabel: '连接飞书',
        onBtnClick: () => message.info('飞书集成功能开发中'),
      },
      {
        key: 'wecom',
        name: '企业微信集成',
        desc: '连接企业微信后可同步通讯录和消息推送',
        icon: <WechatOutlined style={{ fontSize: 22 }} />,
        iconBg: '#f0f5ff',
        iconColor: '#1677ff',
        connected: false,
        btnLabel: '连接企业微信',
        onBtnClick: () => message.info('企业微信集成功能开发中'),
      },
    ];

    return (
      <div>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.text, margin: 0 }}>
            通信连接
          </h2>
          <p style={{ fontSize: 14, color: COLORS.textSecondary, margin: '4px 0 0' }}>
            管理第三方通信平台的集成与连接状态
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {integrations.map((item) => (
            <div
              key={item.key}
              style={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: COLORS.bg,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: item.iconBg,
                    color: item.iconColor,
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 2 }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 }}>
                    {item.desc}
                  </div>
                  {item.connected ? (
                    <Space size={4}>
                      <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 12 }} />
                      <span style={{ fontSize: 12, color: '#52c41a' }}>已连接</span>
                    </Space>
                  ) : (
                    <Space size={4}>
                      <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 12 }} />
                      <span style={{ fontSize: 12, color: COLORS.textAux }}>未连接</span>
                    </Space>
                  )}
                </div>
              </div>
              <Button
                icon={<LinkOutlined />}
                onClick={item.onBtnClick}
                style={{ borderRadius: 6, height: 34 }}
              >
                {item.btnLabel}
              </Button>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div
          style={{
            marginTop: 16,
            padding: '12px 16px',
            background: COLORS.inputBg,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <ApiOutlined style={{ color: COLORS.textAux }} />
          <span style={{ fontSize: 13, color: COLORS.textAux }}>
            更多通信平台集成（钉钉、Slack 等）将在后续版本中陆续开放
          </span>
        </div>
      </div>
    );
  };

  /* ================================================================ */
  /*  Section: 大模型设置                                               */
  /* ================================================================ */

  const renderAISection = () => {
    return (
      <div>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.text, margin: 0 }}>
            大模型设置
          </h2>
          <p style={{ fontSize: 14, color: COLORS.textSecondary, margin: '4px 0 0' }}>
            配置 AI 算力与智能解析功能
          </p>
        </div>

        {/* Status banner */}
        <div
          style={{
            background: `linear-gradient(135deg, ${COLORS.gradientStart}, ${COLORS.gradientEnd})`,
            borderRadius: 8,
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
            }}
          >
            <ThunderboltOutlined style={{ fontSize: 20 }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>
              AI 算力节点已连接
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
              当前正在使用 GLM-4 视觉解析引擎与专用人才向量空间
            </div>
          </div>
        </div>

        {/* Config items */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {aiItems.map((item, idx) => (
            <div key={item.id}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '18px 4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: config[item.id] ? COLORS.primaryBg : '#f5f5f5',
                      color: config[item.id] ? COLORS.primary : COLORS.textAux,
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
                <Switch checked={!!config[item.id]} onChange={() => handleToggle(item.id)} />
              </div>
              {idx < aiItems.length - 1 && (
                <div style={{ height: 1, background: COLORS.border }} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ================================================================ */
  /*  Section: 安全设置                                                 */
  /* ================================================================ */

  const renderSecuritySection = () => {
    const isAdmin = profile?.role === 'admin';

    return (
      <div>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.text, margin: 0 }}>
            安全设置
          </h2>
          <p style={{ fontSize: 14, color: COLORS.textSecondary, margin: '4px 0 0' }}>
            管理账户安全策略与审计日志
          </p>
        </div>

        {/* Personal security items */}
        <div style={{ marginBottom: isAdmin ? 36 : 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            个人安全
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {securityItems.map((item, idx) => (
              <div key={item.id}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '18px 4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: config[item.id] ? COLORS.primaryBg : '#f5f5f5',
                        color: config[item.id] ? COLORS.primary : COLORS.textAux,
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                  <Switch checked={!!config[item.id]} onChange={() => handleToggle(item.id)} />
                </div>
                {idx < securityItems.length - 1 && (
                  <div style={{ height: 1, background: COLORS.border }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Admin-only: global security */}
        {isAdmin && (
          <>
            <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 28, marginBottom: 20 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#fff1f0',
                  color: '#cf1322',
                  padding: '2px 10px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 16,
                }}
              >
                <SettingOutlined />
                管理员专属
              </div>
            </div>

            {/* System audit log */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <AuditOutlined style={{ color: COLORS.primary }} />
                <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>
                  系统操作日志
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  { label: '最近登录', value: '暂无记录' },
                  { label: '最近数据导出', value: '暂无记录' },
                  { label: '最近权限变更', value: '暂无记录' },
                ].map((row, idx) => (
                  <div
                    key={row.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                    }}
                  >
                    <span style={{ fontSize: 14, color: COLORS.textSecondary }}>{row.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ClockCircleOutlined style={{ color: COLORS.textAux, fontSize: 12 }} />
                      <span style={{ fontSize: 13, color: COLORS.textAux }}>{row.value}</span>
                    </div>
                    {idx < 2 && <div style={{ display: 'none' }} />}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: COLORS.textAux, marginTop: 4 }}>
                完整操作日志将通过 GET /audit-logs 接口获取，功能开发中
              </div>
            </div>

            {/* Global security policy */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <SettingOutlined style={{ color: COLORS.primary }} />
                <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>
                  全局安全策略
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  { name: '密码策略', desc: '要求密码包含大小写字母、数字和特殊字符，最少 8 位', tag: '标准模式', tagColor: 'blue' },
                  { name: '会话超时', desc: '用户无操作超过设定时间后自动登出', tag: '30 分钟', tagColor: 'blue' },
                  { name: 'IP 白名单', desc: '仅允许指定 IP 地址访问系统管理接口', tag: '未启用', tagColor: 'default' },
                ].map((row, idx) => (
                  <div key={row.name}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '14px 0',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>
                          {row.name}
                        </div>
                        <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>
                          {row.desc}
                        </div>
                      </div>
                      <Tag color={row.tagColor}>{row.tag}</Tag>
                    </div>
                    {idx < 2 && <div style={{ height: 1, background: COLORS.border }} />}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: COLORS.textAux, marginTop: 4 }}>
                全局安全策略配置功能开发中，仅管理员可见
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  /* ================================================================ */
  /*  Section: 数据同步                                                 */
  /* ================================================================ */

  const renderDataSyncSection = () => {
    return (
      <div>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.text, margin: 0 }}>
            数据同步
          </h2>
          <p style={{ fontSize: 14, color: COLORS.textSecondary, margin: '4px 0 0' }}>
            管理外部数据源的同步与导入
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Feishu sync card */}
          <div
            style={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fff7e6',
                  color: '#fa8c16',
                  flexShrink: 0,
                }}
              >
                <SyncOutlined style={{ fontSize: 20 }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 2 }}>
                  飞书多维表格同步
                </div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 }}>
                  从飞书多维表格同步候选人数据到系统
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ClockCircleOutlined style={{ color: COLORS.textAux, fontSize: 12 }} />
                  <span style={{ fontSize: 12, color: COLORS.textAux }}>上次同步：尚未同步</span>
                </div>
              </div>
            </div>
            <Button
              icon={<SyncOutlined />}
              onClick={() => message.info('飞书表格同步功能开发中')}
              style={{ borderRadius: 6, height: 34 }}
            >
              立即同步
            </Button>
          </div>

          {/* Data import card */}
          <div
            onClick={() => router.push('/imports')}
            style={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.primaryBgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = COLORS.bg)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: COLORS.primaryBg,
                  color: COLORS.primary,
                  flexShrink: 0,
                }}
              >
                <ImportOutlined style={{ fontSize: 20 }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 2 }}>
                  数据导入管理
                </div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary }}>
                  Legacy、插件与手工上传进入正式人才库前的审核区
                </div>
              </div>
            </div>
            <RightOutlined style={{ color: '#bbb', fontSize: 14 }} />
          </div>
        </div>

        {/* Footer note */}
        <div
          style={{
            marginTop: 16,
            padding: '12px 16px',
            background: COLORS.inputBg,
            borderRadius: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <span style={{ fontSize: 13, color: COLORS.textAux }}>
            支持从飞书多维表格、Excel 文件等来源同步数据
          </span>
          <span style={{ fontSize: 13, color: COLORS.textAux }}>
            更多数据源（Google Sheets、CSV 等）将在后续版本中支持
          </span>
        </div>
      </div>
    );
  };

  /* ================================================================ */
  /*  Section renderer                                                 */
  /* ================================================================ */

  const renderSection = () => {
    switch (activeMenu) {
      case 'profile':
        return renderProfileSection();
      case 'team':
        return renderTeamSection();
      case 'integrations':
        return renderIntegrationsSection();
      case 'ai':
        return renderAISection();
      case 'security':
        return renderSecuritySection();
      case 'sync':
        return renderDataSyncSection();
      default:
        return null;
    }
  };

  /* ================================================================ */
  /*  Main Render                                                      */
  /* ================================================================ */

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', padding: '32px 40px' }}>
      {/* Page title */}
      <h1 style={{ fontSize: 24, fontWeight: 700, color: COLORS.text, margin: '0 0 28px' }}>
        设置
      </h1>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: 0, minHeight: 'calc(100vh - 140px)' }}>
        {/* Left sidebar menu */}
        <div
          style={{
            width: 220,
            flexShrink: 0,
            borderRight: `1px solid ${COLORS.borderMenu}`,
            paddingRight: 0,
          }}
        >
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {MENU_ITEMS.map((item) => {
              const IconComp = item.icon;
              const isActive = activeMenu === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveMenu(item.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 16px',
                    border: 'none',
                    background: isActive ? COLORS.primaryBg : 'transparent',
                    color: isActive ? COLORS.primary : COLORS.textSecondary,
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    borderRadius: 0,
                    textAlign: 'left',
                    position: 'relative',
                    transition: 'background 0.15s, color 0.15s',
                    width: '100%',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = COLORS.primaryBgHover;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Left indicator bar */}
                  {isActive && (
                    <span
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 4,
                        bottom: 4,
                        width: 3,
                        borderRadius: '0 2px 2px 0',
                        background: COLORS.primary,
                      }}
                    />
                  )}
                  <IconComp style={{ fontSize: 16, color: isActive ? COLORS.primary : COLORS.textAux }} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right content area */}
        <div
          style={{
            flex: 1,
            paddingLeft: 36,
            paddingRight: 24,
            overflowY: 'auto',
          }}
        >
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
