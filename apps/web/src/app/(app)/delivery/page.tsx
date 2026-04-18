'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  Tag, 
  Typography, 
  Space, 
  Select, 
  Modal, 
  Button, 
  Empty, 
  Skeleton, 
  message, 
  Divider, 
  DatePicker,
  Avatar,
  Tooltip,
  Badge
} from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  UserOutlined, 
  SendOutlined,
  CalendarOutlined,
  CopyOutlined,
  ShareAltOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  EllipsisOutlined,
  HistoryOutlined,
  RobotOutlined,
  FireOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import JobSidebar from '@/components/delivery/JobSidebar';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface Recommendation {
  id: string;
  candidateId: string;
  candidateName?: string;
  candidateAvatar?: string;
  jobPositionId: string;
  status: string;
  matchScore: number;
  aiAnalysis?: any;
  interviewDate?: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string, color: string, bg: string }> = {
  pending: { label: '待初筛', color: '#94a3b8', bg: '#f8fafc' },
  submitted: { label: '已推荐', color: '#3b82f6', bg: '#eff6ff' },
  reviewing: { label: '企业评估', color: '#f59e0b', bg: '#fffbeb' },
  interview_scheduled: { label: '约面中', color: '#8b5cf6', bg: '#f5f3ff' },
  offer_sent: { label: '发Offer', color: '#06b6d4', bg: '#ecfeff' },
  accepted: { label: '已入职', color: '#10b981', bg: '#f0fdf4' },
};

export default function DeliveryPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Recommendation[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('job-1');
  const [selectedReport, setSelectedReport] = useState<Recommendation | null>(null);
  const [isReportVisible, setIsReportVisible] = useState(false);
  
  const [isOutreachVisible, setIsOutreachVisible] = useState(false);
  const [outreachText, setOutreachText] = useState('');
  const [loadingOutreach, setLoadingOutreach] = useState(false);

  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [currentShareData, setCurrentShareData] = useState<{ link: string, pitch: string } | null>(null);
  const [loadingShare, setLoadingShare] = useState(false);

  // 模拟职位数据
  const mockJobs = [
    { id: 'job-1', title: '高级后端开发工程师', count: 12, status: 'active' as const },
    { id: 'job-2', title: '资深产品经理', count: 5, status: 'active' as const },
    { id: 'job-3', title: '架构师 (基础平台)', count: 8, status: 'active' as const },
  ];

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      // 实际开发中应根据 selectedJobId 过滤
      const res = await fetch('/api/recommendations');
      const json = await res.json();
      
      // 注入一些模拟数据以确保看板丰满
      const mockData = [
        { id: 'rec-1', candidateName: '张建国', matchScore: 92, status: 'pending', candidateId: 'c1', updatedAt: '2023-11-20' },
        { id: 'rec-2', candidateName: '李美美', matchScore: 88, status: 'submitted', candidateId: 'c2', updatedAt: '2023-11-19' },
        { id: 'rec-3', candidateName: '王小明', matchScore: 75, status: 'reviewing', candidateId: 'c3', updatedAt: '2023-11-18' },
        { id: 'rec-4', candidateName: '赵铁柱', matchScore: 95, status: 'interview_scheduled', candidateId: 'c4', updatedAt: '2023-11-17', interviewDate: '2023-11-25' },
      ];
      
      setData(json.length > 0 ? json : mockData);
    } catch (e) {
      message.error('加载交付数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [selectedJobId]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/recommendations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        message.success('状态更新成功');
        fetchRecommendations();
      }
    } catch (e) {
      message.error('更新失败');
    }
  };

  const handleScheduleChange = async (id: string, date: any) => {
    try {
      const res = await fetch(`/api/recommendations/${id}/schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewDate: date ? date.toDate() : null }),
      });
      if (res.ok) {
        message.success('面试日程已更新');
        fetchRecommendations();
      }
    } catch (e) {
      message.error('日程更新失败');
    }
  };

  const handleGenerateOutreach = async (id: string) => {
    setIsOutreachVisible(true);
    setLoadingOutreach(true);
    setOutreachText('');
    try {
      const res = await fetch(`/api/recommendations/${id}/outreach`);
      const text = await res.text();
      setOutreachText(text || '尊敬的候选人您好，看到您的简历与我们目前招聘的高级开发职位非常匹配...');
    } catch (e) {
      message.error('生成邀约话术失败');
    } finally {
      setLoadingOutreach(false);
    }
  };

  const handleOpenShare = async (id: string) => {
    setIsShareModalVisible(true);
    setLoadingShare(true);
    try {
      // 模拟分享链接生成
      setTimeout(() => {
        const url = `${window.location.origin}/share/temp-token-123`;
        setCurrentShareData({
          link: url,
          pitch: `您好，为您推荐一位非常匹配的候选人。报告链接：${url}`,
        });
        setLoadingShare(false);
      }, 1000);
    } catch (e) {
      message.error('生成分享链接失败');
      setLoadingShare(false);
    }
  };

  const showReport = (rec: Recommendation) => {
    setSelectedReport(rec);
    setIsReportVisible(true);
    // 确保有模拟的分析数据
    if (!rec.aiAnalysis) {
      const mockAnalysis = {
        highlights: ['5年大厂后端经验', '精通微服务架构', '有过亿级流量处理案例'],
        risks: ['目前在职，到岗时间可能需要1个月', '对薪酬涨幅要求较高'],
        interviewSuggestions: ['重点考察高并发场景下的限流方案', '询问其在分布式事务中的实战经验'],
        conclusion: '综合评估通过。候选人技术底子扎实，是该岗位的理想人选。'
      };
      setSelectedReport({ ...rec, aiAnalysis: mockAnalysis });
    }
  };

  const copyToClipboard = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    message.success(msg);
  };

  return (
    <div className="flex h-full bg-[#f8fafc] overflow-hidden">
      {/* 1. 左侧职位导航 */}
      <JobSidebar 
        jobs={mockJobs} 
        selectedJobId={selectedJobId} 
        onSelect={setSelectedJobId} 
      />

      {/* 2. 右侧看板区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 看板头部 */}
        <div className="bg-white px-8 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <Title level={4} className="m-0">{mockJobs.find(j => j.id === selectedJobId)?.title}</Title>
              <Tag color="blue" className="rounded-full border-none px-2 opacity-80 text-[10px]">进行中</Tag>
            </div>
            <Text type="secondary" className="text-xs">
              <HistoryOutlined className="mr-1" /> 
              最近更新: 2023-11-20 · 交付顾问: Lee
            </Text>
          </div>
          <Space>
            <Button icon={<ShareAltOutlined />} className="rounded-lg">批量分享</Button>
            <Button type="primary" icon={<ThunderboltOutlined />} className="rounded-lg bg-blue-600 border-none shadow-sm shadow-blue-100">
              AI 智能催办
            </Button>
          </Space>
        </div>

        {/* 看板主体 */}
        <div className="flex-1 overflow-x-auto p-6 flex space-x-6 scroll-smooth items-start bg-[#f1f5f9]/40">
          {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => (
            <div key={statusKey} className="w-80 shrink-0 flex flex-col max-h-full">
              {/* 列头部 */}
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center space-x-2">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                   <Text strong className="text-sm text-gray-700">{config.label}</Text>
                   <Badge 
                    count={data.filter(r => r.status === statusKey).length} 
                    style={{ backgroundColor: '#e2e8f0', color: '#64748b', boxShadow: 'none', fontSize: '10px' }} 
                   />
                </div>
              </div>

              {/* 卡片列表 */}
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {data
                    .filter(r => r.status === statusKey)
                    .map((rec) => (
                    <motion.div
                      key={rec.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <Card 
                        hoverable 
                        className="rounded-xl border-none shadow-sm hover:shadow-md transition-all group overflow-hidden"
                        styles={{ body: { padding: '16px' } }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <Space>
                            <Avatar 
                              size={36} 
                              src={rec.candidateAvatar} 
                              icon={<UserOutlined />} 
                              className="bg-blue-100 text-blue-500 border-2 border-white shadow-sm" 
                            />
                            <div>
                              <Text strong className="block text-sm text-gray-800">{rec.candidateName || `候选人_${rec.id}`}</Text>
                              <Text type="secondary" className="text-[10px]">{rec.updatedAt}</Text>
                            </div>
                          </Space>
                          <div className="flex flex-col items-end">
                            <div className="flex items-center">
                              <Text className="text-blue-600 font-bold text-sm">{Math.round(rec.matchScore)}%</Text>
                            </div>
                            <Text className="text-[9px] text-gray-400 font-medium">匹配度</Text>
                          </div>
                        </div>

                        <div className="bg-gray-50/80 rounded-lg p-2.5 mb-4 border border-gray-50">
                          <Paragraph ellipsis={{ rows: 2 }} className="text-[11px] text-gray-500 m-0 leading-relaxed italic">
                            “ 技术栈高度契合，有中大型项目落地经验，期望薪资在预算范围内。 ”
                          </Paragraph>
                        </div>

                        {/* 面试日期快速选择 */}
                        <div className="mb-4">
                          <DatePicker 
                            size="small" 
                            placeholder="安排面试时间" 
                            className="w-full text-[11px] rounded bg-blue-50/30 border-blue-100/30"
                            value={rec.interviewDate ? dayjs(rec.interviewDate) : null}
                            onChange={(date) => handleScheduleChange(rec.id, date)}
                            suffixIcon={<CalendarOutlined style={{ fontSize: '10px' }} />}
                          />
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-gray-50/80">
                          <Space size={14}>
                             <Tooltip title="AI 邀约话术">
                               <SendOutlined 
                                 className="text-gray-400 hover:text-blue-500 cursor-pointer text-xs" 
                                 onClick={() => handleGenerateOutreach(rec.id)}
                               />
                             </Tooltip>
                             <Tooltip title="生成分享链接">
                               <ShareAltOutlined 
                                 className="text-gray-400 hover:text-green-500 cursor-pointer text-xs" 
                                 onClick={() => handleOpenShare(rec.id)}
                               />
                             </Tooltip>
                             <Select 
                                size="small" 
                                defaultValue={rec.status} 
                                variant="borderless"
                                className="text-[11px] w-20 text-gray-400"
                                onChange={(val) => handleStatusChange(rec.id, val)}
                              >
                                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                  <Option key={k} value={k}>{v.label}</Option>
                                ))}
                              </Select>
                          </Space>
                          <Button 
                            type="primary" 
                            size="small" 
                            ghost
                            className="text-[11px] h-7 px-2 rounded-md border-blue-200"
                            onClick={() => showReport(rec)}
                          >
                            AI 报告
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {data.filter(r => r.status === statusKey).length === 0 && (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={null} className="opacity-40" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI 报告 Modal - 简体中文 */}
      <Modal
        title={
          <Space>
            <RobotOutlined className="text-blue-500" />
            <span>AI 深度画像匹配报告</span>
          </Space>
        }
        open={isReportVisible}
        onCancel={() => setIsReportVisible(false)}
        footer={null}
        width={750}
        centered
        className="mophy-modal"
      >
        <div className="p-4">
          {selectedReport?.aiAnalysis && (
            <div className="space-y-6">
              <Card size="small" className="bg-green-50/30 border-green-100 rounded-xl">
                 <Title level={5} className="text-green-700 mb-3"><CheckCircleOutlined className="mr-2" />核心亮点</Title>
                 <ul className="text-sm text-gray-600 pl-4 space-y-2">
                    {selectedReport.aiAnalysis.highlights.map((h: any, i: any) => <li key={i}>{h}</li>)}
                 </ul>
              </Card>

              <Card size="small" className="bg-orange-50/30 border-orange-100 rounded-xl">
                 <Title level={5} className="text-orange-700 mb-3"><FireOutlined className="mr-2" />潜在风险</Title>
                 <ul className="text-sm text-gray-600 pl-4 space-y-2">
                    {selectedReport.aiAnalysis.risks.map((r: any, i: any) => <li key={i}>{r}</li>)}
                 </ul>
              </Card>

              <div className="p-4 bg-gray-50 rounded-xl italic text-gray-500 text-sm">
                AI 专家结论：{selectedReport.aiAnalysis.conclusion}
              </div>

              <div className="text-right">
                <Button type="primary" className="rounded-lg h-10 px-8" onClick={() => setIsReportVisible(false)}>
                  了解，安排后续
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* 邀约话术 Modal - 简体中文 */}
      <Modal
        title="AI 邀约话术生成"
        open={isOutreachVisible}
        onCancel={() => setIsOutreachVisible(false)}
        footer={null}
        centered
      >
        <div className="py-4">
          <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200 relative group">
            <Paragraph className="text-[15px] leading-relaxed m-0">{outreachText}</Paragraph>
            <Button 
               icon={<CopyOutlined />} 
               className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
               onClick={() => copyToClipboard(outreachText, '已复制到剪贴板')}
            />
          </div>
          <p className="mt-4 text-xs text-gray-400 text-center">系统已自动为您生成针对该职位的差异化推荐理由</p>
        </div>
      </Modal>

    </div>
  );
}
