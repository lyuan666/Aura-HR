'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Typography, 
  Card, 
  Tag, 
  Space, 
  Divider, 
  Button, 
  Result, 
  Skeleton, 
  message, 
  Row, 
  Col, 
  Avatar 
} from 'antd';
import {
  SolutionOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import api from '@/lib/api';

const { Title, Text, Paragraph } = Typography;

export default function PublicSharePage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/share/${token}`);
        setData(res.data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleFeedback = async (type: string) => {
    setSubmitting(true);
    try {
      await api.post(`/share/${token}/feedback`, {
        feedback: type === 'accept' ? '企业已选中，建议约面' : '企业评估不合适',
      });
      message.success('反馈已成功传达给猎头');
      setFeedbackSent(true);
    } catch (e) {
      message.error('提交反馈失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return <Result status="404" title="访问受限" subTitle={error} />;
  if (loading) return <div style={{ padding: '100px 20px', maxWidth: 800, margin: '0 auto' }}><Skeleton active paragraph={{ rows: 10 }} /></div>;

  const { profile, aiAnalysis, job } = data;

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 850, margin: '0 auto' }}>
        
        {/* Header Section */}
        <Card style={{ marginBottom: 24, borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Row align="middle" gutter={24}>
            <Col flex="80px">
              <Avatar size={80} icon={<UserOutlined />} src={profile.avatar} style={{ backgroundColor: '#1890ff' }} />
            </Col>
            <Col flex="auto">
              <Title level={3} style={{ marginBottom: 4 }}>{profile.name} - 候选人推荐报告</Title>
              <Space split={<Divider type="vertical" />}>
                <Text type="secondary"><CalendarOutlined /> {profile.yearsOfExperience || '7'}年经验</Text>
                <Text type="secondary"><GlobalOutlined /> {job.title}</Text>
                <Text type="secondary">匹配度: <Text type="success" strong>{Math.round(aiAnalysis?.totalScore || 85)}%</Text></Text>
              </Space>
            </Col>
            <Col>
              <Tag color="blue" style={{ padding: '4px 12px', fontSize: 13 }}>独家推荐</Tag>
            </Col>
          </Row>
        </Card>

        {/* AI Analysis Section */}
        <Title level={4} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ThunderboltOutlined style={{ color: '#faad14' }} /> AI 深度评估洞察
        </Title>
        <Card style={{ marginBottom: 24, borderRadius: 12, border: 'none' }}>
          <Row gutter={24}>
            <Col span={24}>
              <div style={{ background: '#f6ffed', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #52c41a', marginBottom: 20 }}>
                <Title level={5}><CheckCircleOutlined style={{ color: '#52c41a' }} /> 核心亮点 (Highlights)</Title>
                <ul style={{ paddingLeft: 20 }}>
                  {aiAnalysis.highlights.map((h: string, i: number) => (
                    <li key={i} style={{ marginBottom: 6 }}>{h}</li>
                  ))}
                </ul>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ background: '#fff7e6', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #faad14', height: '100%' }}>
                <Title level={5}><WarningOutlined style={{ color: '#faad14' }} /> 潜在风险 (Risks)</Title>
                <ul style={{ paddingLeft: 20 }}>
                  {aiAnalysis.risks.map((r: string, i: number) => (
                    <li key={i} style={{ marginBottom: 6 }}>{r}</li>
                  ))}
                </ul>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ background: '#e6f7ff', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #1890ff', height: '100%' }}>
                <Title level={5}><BulbOutlined style={{ color: '#1890ff' }} /> 面试建议 (Suggestions)</Title>
                <ul style={{ paddingLeft: 20 }}>
                  {aiAnalysis.interviewSuggestions.map((s: string, i: number) => (
                    <li key={i} style={{ marginBottom: 6 }}>{s}</li>
                  ))}
                </ul>
              </div>
            </Col>
          </Row>
          
          <Divider orientation="left">专家评估结论</Divider>
          <Paragraph style={{ fontStyle: 'italic', color: '#595959', padding: '0 12px' }}>
            {aiAnalysis.conclusion}
          </Paragraph>
        </Card>

        {/* Professional Summary */}
        <Title level={4} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <SolutionOutlined style={{ color: '#1890ff' }} /> 履历概要 (已脱敏)
        </Title>
        <Card style={{ marginBottom: 80, borderRadius: 12, border: 'none' }}>
          <Title level={5}>候选人画像</Title>
          <Space wrap size={[0, 8]} style={{ marginBottom: 20 }}>
            {profile.skills.map((s: string, i: number) => <Tag key={i}>{s}</Tag>)}
          </Space>
          <Paragraph>
            <Text strong>教育背景：</Text> {profile.education || '统招本科 / 计算机科学相关专业'}
          </Paragraph>
          <Divider />
          <Text type="secondary">更多详细工作经历受隐私保护已部分脱敏，如需完整简历及联系方式，请点击“发起约面”与猎头取得联系。</Text>
        </Card>

        {/* Sticky Feedback Bar */}
        {!feedbackSent ? (
          <div style={{ 
            position: 'fixed', 
            bottom: 24, 
            left: '50%', 
            transform: 'translateX(-50%)', 
            width: '90%', 
            maxWidth: 600, 
            background: '#fff', 
            padding: '16px 32px', 
            borderRadius: '50px', 
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 1000,
            border: '1px solid #eee'
          }}>
            <Text strong style={{ fontSize: 15 }}>您对此人选有何意向？</Text>
            <Space size={16}>
              <Button 
                danger 
                icon={<CloseCircleOutlined />} 
                loading={submitting}
                onClick={() => handleFeedback('reject')}
              >
                不合适
              </Button>
              <Button 
                type="primary" 
                size="large" 
                icon={<CheckCircleOutlined />} 
                loading={submitting}
                onClick={() => handleFeedback('accept')}
                style={{ borderRadius: '25px', padding: '0 32px' }}
              >
                发起面试
              </Button>
            </Space>
          </div>
        ) : (
          <div style={{ 
            position: 'fixed', 
            bottom: 24, 
            left: '50%', 
            transform: 'translateX(-50%)', 
            width: '90%', 
            maxWidth: 400, 
            background: '#52c41a', 
            color: '#fff',
            padding: '12px 32px', 
            borderRadius: '50px', 
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(82,196,26,0.3)',
            zIndex: 1000
          }}>
            <CheckCircleOutlined /> 反馈已传达，猎头将尽快为您安排后续
          </div>
        )}
      </div>
    </div>
  );
}
