'use client';

import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Space, Button, Badge } from 'antd';
import { 
  ReloadOutlined, 
  SettingOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import api from '@/lib/api';
import { 
  QuickNavWidget, 
  DemandHeatmapWidget, 
  ClientTrackerWidget, 
  PipelineFunnelWidget, 
  LatestTalentWidget 
} from '@/components/dashboard/DashboardWidgets';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    candidates: [],
    jobs: [],
    enterprises: [],
    stats: {
      candidateCount: 0,
      jobCount: 0,
      recommendationCount: 0,
      acceptedCount: 0
    },
    funnel: [],
    talentStats: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      // 同时加载基础数据与统计数据
      const [candRes, jobRes, entRes, statsRes, funnelRes, talentStatsRes] = await Promise.all([
        api.get('/candidates'),
        api.get('/job-positions'),
        api.get('/enterprises'),
        api.get('/analytics/overview').catch(() => ({ data: {} })),
        api.get('/analytics/delivery-funnel').catch(() => ({ data: [] })),
        api.get('/analytics/talent-stats').catch(() => ({ data: [] }))
      ]);

      setData({
        candidates: candRes.data,
        jobs: jobRes.data,
        enterprises: entRes.data,
        stats: statsRes.data,
        funnel: funnelRes.data,
        talentStats: talentStatsRes.data
      });
    } catch (e) {
      console.error('Data pull failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between mb-8 px-4">
        <div>
          <Title level={2} className="m-0 font-black tracking-tight text-slate-800">运营中心</Title>
          <div className="flex items-center mt-1">
             <Badge status="processing" className="mr-2" />
             <Text className="text-slate-400 text-xs italic">Hunter Operations Hub v4</Text>
          </div>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData} className="rounded-xl border-slate-200" />
          <Button 
            type="primary" 
            icon={<AppstoreOutlined />} 
            className="rounded-xl bg-slate-900 border-none px-6 font-bold shadow-lg shadow-slate-200"
          >
            自定义布局
          </Button>
        </Space>
      </div>

      {/* 主体布局 - 采用稳定多列网格 */}
      <div className="overflow-y-auto no-scrollbar pb-12">
        <Row gutter={[24, 24]}>
          {/* 左侧：交付主阵地 */}
          <Col lg={16} md={24}>
            <div className="space-y-6">
              <Row gutter={[24, 24]}>
                <Col span={12}>
                  <QuickNavWidget />
                </Col>
                <Col span={12}>
                   {/* 此处可放置更多统计或快捷功能 */}
                   <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 h-full text-white shadow-lg shadow-indigo-100 flex flex-col justify-between">
                      <Title level={4} className="text-white m-0 font-black opacity-90">AI 推荐引擎</Title>
                      <Text className="text-indigo-100 text-xs mt-2 block">基于 200+ 核心岗位自动计算人才匹配度</Text>
                      <Button ghost className="mt-4 border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors w-24 text-xs font-bold">进入实验室</Button>
                   </div>
                </Col>
              </Row>
              
              <PipelineFunnelWidget data={data.funnel} />
              <LatestTalentWidget data={data.candidates} />
            </div>
          </Col>

          {/* 右侧：需求与客户 CRM */}
          <Col lg={8} md={24}>
            <div className="space-y-6">
              <DemandHeatmapWidget data={data.jobs} />
              <ClientTrackerWidget data={data.enterprises} />
              
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                 <Title level={5} className="font-black text-slate-700 mb-4">公告推送</Title>
                 <div className="space-y-3">
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 border-dashed">
                       <Text className="text-[11px] text-rose-600 font-bold block">🚨 系统安全提醒</Text>
                       <Text className="text-[10px] text-rose-400">请及时更新您的 API 密钥以维持简历解析服务稳定。</Text>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                       <Text className="text-[11px] text-slate-800 font-bold block text-indigo-600">💡 效率技巧</Text>
                       <Text className="text-[10px] text-slate-400">使用 Shift + F 可快速调出高级筛选面板。</Text>
                    </div>
                 </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}
