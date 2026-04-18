'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Table, Tag, Typography, Progress, Space, Button, message, Row, Col, Divider, Skeleton } from 'antd';
import { ArrowLeftOutlined, RobotOutlined, UserOutlined, FileSearchOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface MatchResult {
  candidate: {
    id: string;
    name: string;
    avatar?: string;
    parsedTags?: {
      skills: string[];
      experience: string;
    };
  };
  score: number;
  semanticScore: number;
  tagMatchScore: number;
}

interface JobDetail {
  id: string;
  title: string;
  description: string;
  salaryMin?: number;
  salaryMax?: number;
  skillTags?: string[];
  enhancedDescription?: string;
}

export default function JobMatchesPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<JobDetail | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [jobRes, matchRes] = await Promise.all([
          fetch(`/api/job-positions/${id}`),
          fetch(`/api/matching/jobs/${id}`)
        ]);
        
        if (jobRes.ok && matchRes.ok) {
          const jobData = await jobRes.json();
          const matchData = await matchRes.json();
          setJob(jobData);
          setMatches(matchData);
        }
      } catch (e) {
        message.error('加载匹配数据失败');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const columns = [
    {
      title: '候选人',
      dataIndex: ['candidate', 'name'],
      key: 'name',
      render: (name: string) => (
        <Space>
          <UserOutlined />
          <Text strong>{name}</Text>
        </Space>
      )
    },
    {
      title: '综合得分',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => (
        <Progress 
          percent={score} 
          size="small" 
          strokeColor={score > 80 ? '#52c41a' : (score > 60 ? '#1890ff' : '#faad14')} 
        />
      )
    },
    {
      title: '语义契合',
      dataIndex: 'semanticScore',
      key: 'semanticScore',
      render: (score: number) => <Tag color="blue">{score}%</Tag>
    },
    {
      title: '技能覆盖',
      dataIndex: 'tagMatchScore',
      key: 'tagMatchScore',
      render: (score: number) => <Tag color="cyan">{score}%</Tag>
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: MatchResult) => (
        <Space>
          <Button 
            size="small"
            icon={<RobotOutlined />}
            onClick={() => handleShowAnalysis(record)}
          >
            AI 深度分析
          </Button>
          <Button 
            type="primary" 
            size="small"
            onClick={() => handleRecommend(record)}
          >
            一键推荐
          </Button>
        </Space>
      )
    }
  ];

  const handleRecommend = async (record: MatchResult) => {
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: record.candidate.id,
          jobId: id,
        }),
      });
      if (res.ok) {
        message.success('已加入交付看板，可在“交付管理”中跟进状态');
      }
    } catch (e) {
      message.error('推荐失败');
    }
  };

  const [isReportVisible, setIsReportVisible] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const handleShowAnalysis = async (record: MatchResult) => {
    setIsReportVisible(true);
    setReportLoading(true);
    setReportData(null);
    
    try {
      // 首先获取/创建推荐记录，然后获取报告
      const recRes = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: record.candidate.id, jobId: id }),
      });
      
      const rec = await recRes.json();
      const reportRes = await fetch(`/api/recommendations/${rec.id}/report`);
      const report = await reportRes.json();
      
      setReportData(report);
    } catch (e) {
      message.error('生成报告失败');
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}><Skeleton active paragraph={{ rows: 10 }} /></div>;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => router.push('/jobs')} 
        style={{ marginBottom: 16 }}
      >
        返回职位列表
      </Button>

      <Row gutter={24}>
        {/* 左侧：职位画像 */}
        <Col span={8}>
          <Card 
            title={<Space><RobotOutlined /> AI 职位画像</Space>} 
            className="premium-card"
            style={{ height: '100%' }}
          >
            <Title level={4}>{job?.title}</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">期望薪资：</Text>
                <Text strong>{job?.salaryMin}k - {job?.salaryMax}k</Text>
              </div>
              <div>
                <Text type="secondary">核心技能：</Text>
                <div style={{ marginTop: 8 }}>
                  {job?.skillTags?.map(tag => <Tag key={tag} color="gold" style={{ marginBottom: 4 }}>{tag}</Tag>)}
                  {(!job?.skillTags || job.skillTags.length === 0) && <Text type="secondary">解析中...</Text>}
                </div>
              </div>
              <Divider />
              <Text type="secondary">AI 重点总结：</Text>
              <Paragraph style={{ marginTop: 8, fontSize: '13px', color: '#666' }}>
                {job?.enhancedDescription || '正在使用大模型提炼核心需求...'}
              </Paragraph>
            </Space>
          </Card>
        </Col>

        {/* 右侧：匹配结果 */}
        <Col span={16}>
          <Card title="智能算法推荐 (TOP 10)" className="premium-card">
            <Table 
              columns={columns} 
              dataSource={candidatesToResults(matches)} 
              rowKey={(record) => record.candidate.id}
              pagination={false}
              locale={{ emptyText: '暂无匹配候选人，请尝试调整需求或增加人才库' }}
            />
      </Row>

      <Modal
        title={
          <Space>
            <RobotOutlined style={{ color: '#1890ff' }} />
            <span>AI 深度匹配分析 - {job?.title}</span>
          </Space>
        }
        open={isReportVisible}
        onCancel={() => setIsReportVisible(false)}
        footer={[<Button key="close" onClick={() => setIsReportVisible(false)}>关闭</Button>]}
        width={700}
      >
        {reportLoading ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <Progress percent={99} status="active" strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} showInfo={false} />
            <p style={{ marginTop: 16 }}>正在利用 RAG 架构进行简历全文本分析...</p>
          </div>
        ) : reportData ? (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ borderLeft: '4px solid #52c41a', paddingLeft: 12, marginBottom: 12 }}>
                <Text strong style={{ fontSize: 16 }}>匹配优势 (Highlights)</Text>
              </div>
              <ul style={{ paddingLeft: 20 }}>
                {reportData.highlights?.map((h: string, i: number) => (
                  <li key={i} style={{ marginBottom: 6 }}>{h}</li>
                ))}
              </ul>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <div style={{ borderLeft: '4px solid #fa8c16', paddingLeft: 12, marginBottom: 12 }}>
                <Text strong style={{ fontSize: 16 }}>潜在风险 (Risks)</Text>
              </div>
              <ul style={{ paddingLeft: 20 }}>
                {reportData.risks?.map((r: string, i: number) => (
                  <li key={i} style={{ marginBottom: 6 }}>{r}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ borderLeft: '4px solid #1890ff', paddingLeft: 12, marginBottom: 12 }}>
                <Text strong style={{ fontSize: 16 }}>面试官建议 (Interview Tips)</Text>
              </div>
              <ul style={{ paddingLeft: 20 }}>
                {reportData.interviewSuggestions?.map((s: string, i: number) => (
                  <li key={i} style={{ marginBottom: 6 }}>{s}</li>
                ))}
              </ul>
            </div>

            <Divider />
            <Text strong>AI 总结建议：</Text>
            <Paragraph style={{ marginTop: 8, background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
              {reportData.conclusion}
            </Paragraph>
          </div>
        ) : (
          <Empty description="报告生成失败" />
        )}
      </Modal>
    </div>
  );
}

// 辅助函数处理数据结构
function candidatesToResults(matches: any[]) {
  return matches || [];
}
