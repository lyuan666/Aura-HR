'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Avatar, Badge, Input, Tooltip, Popover, Modal, Tag, Space, Spin, Empty, App } from 'antd';
import { Bell, Download, Search, UserPlus } from 'lucide-react';
import { MailOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Notification {
  id: string;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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

/** Format ISO date to short relative string */
const formatTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(iso).toLocaleDateString('zh-CN');
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const V2Header: React.FC = () => {
  const router = useRouter();
  const { message } = App.useApp();

  /* ---- Notification state ---- */
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notiLoading, setNotiLoading] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);

  /* ---- Invite modal state ---- */
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('recruiter');
  const [inviteSending, setInviteSending] = useState(false);

  /* ---- Refs ---- */
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ---- Fetch unread count ---- */
  const fetchUnreadCount = useCallback(() => {
    api
      .get('/notifications/unread-count')
      .then((res) => setUnreadCount(res.data?.count ?? 0))
      .catch(() => {});
  }, []);

  /* ---- Poll unread count every 60s ---- */
  useEffect(() => {
    fetchUnreadCount();
    pollRef.current = setInterval(fetchUnreadCount, 60_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchUnreadCount]);

  /* ---- Fetch notifications when popover opens ---- */
  const fetchNotifications = useCallback(() => {
    setNotiLoading(true);
    api
      .get('/notifications', { params: { page: 1, pageSize: 20 } })
      .then((res) => setNotifications(res.data?.items ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setNotiLoading(false));
  }, []);

  const handleNotiOpenChange = useCallback(
    (open: boolean) => {
      setNotiOpen(open);
      if (open) fetchNotifications();
    },
    [fetchNotifications],
  );

  /* ---- Mark single notification as read ---- */
  const handleMarkRead = useCallback(
    (id: string) => {
      api.patch(`/notifications/${id}/read`).then(() => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }).catch(() => {});
    },
    [],
  );

  /* ---- Mark all as read ---- */
  const handleMarkAllRead = useCallback(() => {
    api
      .patch('/notifications/read-all')
      .then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      })
      .catch(() => {
        message.error('标记全部已读失败');
      });
  }, [message]);

  /* ---- Invite handler ---- */
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

  /* ================================================================ */
  /*  Notification Popover content                                     */
  /* ================================================================ */

  const notiContent = (
    <div style={{ width: 360 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 15, color: '#1f1f1f' }}>通知</span>
        <button
          onClick={handleMarkAllRead}
          style={{
            border: 'none',
            background: 'none',
            color: '#1677ff',
            cursor: 'pointer',
            fontSize: 13,
            padding: 0,
          }}
        >
          全部已读
        </button>
      </div>

      {/* List */}
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {notiLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无通知"
            style={{ padding: '40px 0' }}
          />
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.read) handleMarkRead(n.id);
              }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '12px 16px',
                borderBottom: '1px solid #f5f5f5',
                cursor: n.read ? 'default' : 'pointer',
                background: n.read ? 'transparent' : '#f6f8fa',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!n.read) e.currentTarget.style.background = '#e6f4ff';
              }}
              onMouseLeave={(e) => {
                if (!n.read) e.currentTarget.style.background = '#f6f8fa';
              }}
            >
              {/* Unread dot */}
              <span
                style={{
                  flexShrink: 0,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: n.read ? 'transparent' : '#1677ff',
                  marginTop: 6,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: n.read ? 400 : 600,
                    color: '#1f1f1f',
                    marginBottom: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {n.title}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: '#666',
                    lineHeight: '20px',
                    maxHeight: 40,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {n.content}
                </div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  {formatTime(n.createdAt)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: '1px solid #f0f0f0',
          textAlign: 'center',
          padding: '10px 0',
        }}
      >
        <button
          onClick={() => {
            setNotiOpen(false);
            router.push('/notifications');
          }}
          style={{
            border: 'none',
            background: 'none',
            color: '#1677ff',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          查看全部
        </button>
      </div>
    </div>
  );

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-border-subtle bg-bg-base px-6">
      <div className="min-w-[280px] max-w-[520px] flex-1">
        <Input
          size="middle"
          prefix={<Search size={18} className="text-text-sub" />}
          placeholder="在全部简历中搜索"
          className="h-10 rounded-lg border-border-subtle bg-bg-surface/80 text-text-main placeholder:!text-text-sub/60"
        />
      </div>

      <div className="flex items-center gap-4">
        <Tooltip title="下载浏览器插件">
          <button
            onClick={() => router.push('/downloads')}
            className="text-text-sub transition-colors hover:text-text-main"
            aria-label="下载浏览器插件"
          >
            <Download size={18} />
          </button>
        </Tooltip>

        <Tooltip title="邀请协作成员">
          <button
            onClick={() => setInviteOpen(true)}
            className="text-text-sub transition-colors hover:text-text-main"
            aria-label="邀请协作成员"
          >
            <UserPlus size={18} />
          </button>
        </Tooltip>

        <Popover
          content={notiContent}
          trigger="click"
          open={notiOpen}
          onOpenChange={handleNotiOpenChange}
          placement="bottomRight"
          overlayStyle={{ width: 360 }}
        >
          <Badge count={unreadCount} size="small">
            <button className="text-text-sub transition-colors hover:text-text-main" aria-label="通知">
              <Bell size={18} />
            </button>
          </Badge>
        </Popover>

        <div className="border-l border-border-subtle pl-4">
          <Avatar
            size={32}
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Serati"
            className="ml-2 border border-border-subtle bg-brand-primary"
            style={{ cursor: 'pointer' }}
            onClick={() => router.push('/settings')}
          >
            M
          </Avatar>
        </div>
      </div>

      {/* Invite member modal */}
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
          <span style={{ display: 'block', fontSize: 12, color: '#999', marginBottom: 4 }}>
            邮箱地址
          </span>
          <Input
            prefix={<MailOutlined />}
            placeholder="请输入被邀请人的邮箱"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
        </div>
        <div>
          <span style={{ display: 'block', fontSize: 12, color: '#999', marginBottom: 4 }}>
            角色
          </span>
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
    </header>
  );
};
