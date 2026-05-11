'use client';

import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Switch, List, Typography, Space, App, Divider, Tag } from 'antd';
import { BellOutlined, SendOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '@/lib/api';

const { Text, Title } = Typography;

const EVENT_LABELS: Record<string, string> = {
  interview_reminder: '面试安排提醒',
  match_notification: '人才匹配通知',
  follow_up_reminder: '跟进任务提醒',
  status_change: '推荐状态变更',
};

export default function FeishuNotificationSettings() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState({
    webhookUrl: '',
    enabledEvents: [] as string[],
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/notification/feishu/config');
      if (res.data && res.data.config) {
        setConfig({
          webhookUrl: res.data.config.webhookUrl || '',
          enabledEvents: res.data.config.enabledEvents || [],
        });
      }
    } catch (error) {
      message.error('加载通知配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config.webhookUrl) {
      message.warning('请输入 Webhook URL');
      return;
    }
    setSaving(true);
    try {
      await api.post('/notification/feishu/config', config);
      message.success('通知配置已保存');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config.webhookUrl) {
      message.warning('请先输入 Webhook URL');
      return;
    }
    setTesting(true);
    try {
      await api.post('/notification/feishu/test', {
        webhookUrl: config.webhookUrl,
        text: '这是一条来自天选OS的测试消息。',
      });
      message.success('测试消息已发送，请检查飞书群聊');
    } catch (error) {
      message.error('测试发送失败，请检查 URL 是否正确');
    } finally {
      setTesting(false);
    }
  };

  const toggleEvent = (event: string) => {
    const newEvents = config.enabledEvents.includes(event)
      ? config.enabledEvents.filter((e) => e !== event)
      : [...config.enabledEvents, event];
    setConfig({ ...config, enabledEvents: newEvents });
  };

  return (
    <Card loading={loading} title={<Space><BellOutlined />飞书消息通知</Space>}>
      <div style={{ marginBottom: 24 }}>
        <Title level={5}>Webhook 配置</Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          在飞书群聊中添加“自定义机器人”，获取 Webhook 地址。系统将通过该地址推送自动化提醒。
        </Text>
        <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
          <Input
            placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
            value={config.webhookUrl}
            onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
            style={{ flex: 1 }}
          />
          <Button icon={<SendOutlined />} onClick={handleTest} loading={testing}>
            测试发送
          </Button>
        </div>
      </div>

      <Divider />

      <div style={{ marginBottom: 24 }}>
        <Title level={5}>通知事件订阅</Title>
        <List
          itemLayout="horizontal"
          dataSource={Object.keys(EVENT_LABELS)}
          renderItem={(event) => (
            <List.Item
              actions={[
                <Switch
                  key="switch"
                  checked={config.enabledEvents.includes(event)}
                  onChange={() => toggleEvent(event)}
                />,
              ]}
            >
              <List.Item.Meta
                title={EVENT_LABELS[event]}
                description={
                  event === 'match_notification' ? (
                    <Tag color="green">智能 AI 触发</Tag>
                  ) : (
                    '业务流程触发'
                  )
                }
              />
            </List.Item>
          )}
        />
      </div>

      <div style={{ textAlign: 'right', marginTop: 24 }}>
        <Button type="primary" onClick={handleSave} loading={saving} icon={<CheckCircleOutlined />}>
          保存配置
        </Button>
      </div>
    </Card>
  );
}
