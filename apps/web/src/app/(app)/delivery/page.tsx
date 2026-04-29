'use client';

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Row, Col, Avatar, Tag, Space, Button, App, Skeleton, Empty, Typography, Tooltip, Modal } from 'antd';
import {
  SendOutlined,
  ShareAltOutlined,
  RobotOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import api from '@/lib/api';
import CandidateDetailDrawer from '@/components/candidates/CandidateDetailDrawer';

const { Text, Paragraph } = Typography;

const STATUS_CONFIG: Record<string, { label: string; color: string; desc: string }> = {
  pending: { label: '待初筛', color: 'default', desc: '新流入的人才节点' },
  submitted: { label: '已推荐', color: 'blue', desc: '简历已送达决策层' },
  reviewing: { label: '企业评估', color: 'orange', desc: '用人部门正在审阅' },
  interview_scheduled: { label: '约面中', color: 'cyan', desc: '面试链路已开启' },
  offer_sent: { label: '发Offer', color: 'purple', desc: '进入录用签约环节' },
  accepted: { label: '已入职', color: 'green', desc: '节点交付成功' },
};

export default function DeliveryPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpResult, setFollowUpResult] = useState<any>(null);

  const handleAIFollowUp = async () => {
    const activeRec = filteredData.find(r =>
      !['accepted'].includes(r.status)
    );
    if (!activeRec) {
      message.warning('当前没有需要催办的推荐记录');
      return;
    }
    setFollowUpLoading(true);
    try {
      const res = await api.post('/follow-ups/ai-strategy', {
        targetType: 'candidate',
        targetId: activeRec.candidate?.id || activeRec.id,
      });
      setFollowUpResult(res.data);
    } catch (e) {
      message.error('AI 催办策略生成失败');
    } finally {
      setFollowUpLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/recommendations');
      setData(res.data?.items || []);
    } catch (e) {
      message.error('交付数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const filteredData = data.filter(rec =>
    !searchQuery ||
    [rec.candidate?.name, rec.jobPosition?.title].some(f => f?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <PageContainer
      header={{
        title: '交付看板',
        subTitle: '全链路招聘进度管理',
        extra: [
          <Button key="export" icon={<ShareAltOutlined />}>导出报告</Button>,
          <Button key="ai" type="primary" icon={<RobotOutlined />} loading={followUpLoading} onClick={handleAIFollowUp}>AI 智能催办</Button>,
        ],
      }}
    >
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
        {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => {
          const items = filteredData.filter(r => r.status === statusKey);
          return (
            <div key={statusKey} style={{ minWidth: 300, width: 300, flexShrink: 0 }}>
              <Card
                size="small"
                title={
                  <Space>
                    <Tag color={config.color}>{config.label}</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>{items.length}</Text>
                  </Space>
                }
                extra={<MoreOutlined style={{ cursor: 'pointer' }} />}
                style={{ height: '100%' }}
                styles={{ body: { maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', padding: 12 } }}
              >
                {loading ? (
                  [1, 2].map(i => <Skeleton key={i} active avatar paragraph={{ rows: 2 }} style={{ marginBottom: 12 }} />)
                ) : items.length === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" style={{ padding: '40px 0' }} />
                ) : (
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    {items.map(rec => (
                      <Card
                        key={rec.id}
                        size="small"
                        hoverable
                        onClick={() => {
                          setSelectedCandidate(rec.candidate);
                          setIsDrawerOpen(true);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Space>
                            <Avatar src={rec.candidate?.avatar} style={{ backgroundColor: '#1677ff' }}>
                              {rec.candidate?.name?.[0]}
                            </Avatar>
                            <div>
                              <div style={{ fontWeight: 600 }}>{rec.candidate?.name || '未知'}</div>
                              <Text type="secondary" style={{ fontSize: 12 }}>{rec.jobPosition?.title || '未关联职位'}</Text>
                            </div>
                          </Space>
                          <Text strong style={{ color: '#1677ff', fontSize: 16 }}>
                            {rec.matchScore != null ? `${Math.round(rec.matchScore)}%` : '--'}
                          </Text>
                        </div>
                        <div style={{
                          background: '#f5f5f5',
                          borderRadius: 6,
                          padding: '8px 12px',
                          marginBottom: 8,
                        }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {rec.candidate?.latestReview || '暂无评估信息'}
                          </Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Space>
                            <Tooltip title="AI 邀约建议"><SendOutlined style={{ color: '#999' }} /></Tooltip>
                            <Tooltip title="同步至客户"><ShareAltOutlined style={{ color: '#999' }} /></Tooltip>
                          </Space>
                          <Button size="small" icon={<RobotOutlined />}>AI 报告</Button>
                        </div>
                      </Card>
                    ))}
                  </Space>
                )}
              </Card>
            </div>
          );
        })}
      </div>

      <CandidateDetailDrawer
        visible={isDrawerOpen}
        candidate={selectedCandidate}
        onClose={() => setIsDrawerOpen(false)}
      />

      <Modal
        title="AI 智能催办策略"
        open={!!followUpResult}
        onCancel={() => setFollowUpResult(null)}
        onOk={() => setFollowUpResult(null)}
        okText="知道了"
        cancelButtonProps={{ style: { display: 'none' } }}
        width={560}
      >
        {followUpResult && (
          <div>
            <Paragraph>
              <Text strong>建议跟进方式：</Text>
              {followUpResult.strategy || followUpResult.content || '暂无策略建议'}
            </Paragraph>
            {followUpResult.suggestions && Array.isArray(followUpResult.suggestions) && (
              <div style={{ marginTop: 16 }}>
                <Text strong>推荐行动：</Text>
                <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                  {followUpResult.suggestions.map((s: string, i: number) => (
                    <li key={i} style={{ marginBottom: 4 }}><Text>{s}</Text></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
