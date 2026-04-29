'use client';

import React from 'react';
import { Card, Tag, List, Avatar, Space, Typography, Badge, Button, Empty, Tooltip as AntTooltip } from 'antd';
import {
  RocketOutlined,
  FireOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  BulbOutlined,
  ShopOutlined,
  EllipsisOutlined
} from '@ant-design/icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, FunnelChart as ReFunnelChart, Funnel, LabelList
} from 'recharts';

const { Text, Title } = Typography;

// --- 1. 快捷导航 (Quick Nav) ---
export const QuickNavWidget = () => {
  const links = [
    { name: 'BOSS直聘', icon: 'https://www.zhipin.com/favicon.ico', url: 'https://login.zhipin.com' },
    { name: '猎聘(猎头端)', icon: 'https://c.liepin.com/favicon.ico', url: 'https://h.liepin.com' },
    { name: '企查查', icon: 'https://www.qcc.com/favicon.ico', url: 'https://www.qcc.com' },
    { name: '脉脉', icon: 'https://maimai.cn/favicon.ico', url: 'https://maimai.cn' },
  ];

  return (
    <Card variant="borderless" className="h-full rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <Text strong className="text-slate-800 text-[13px] uppercase tracking-wider font-black">快捷服务</Text>
          <Button type="text" size="small" icon={<EllipsisOutlined />} />
        </div>
        <div className="flex flex-wrap gap-4">
          {links.map((link) => (
            <AntTooltip title={link.name} key={link.name}>
              <div
                className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center cursor-pointer hover:bg-indigo-50 hover:shadow-indigo-100/50 shadow-sm transition-all border border-slate-100"
                onClick={() => window.open(link.url, '_blank')}
              >
                {link.icon.startsWith('http') ? (
                  <img src={link.icon} alt={link.name} className="w-6 h-6 rounded-md object-contain" />
                ) : <RocketOutlined className="text-indigo-500" />}
              </div>
            </AntTooltip>
          ))}
          <div className="w-12 h-12 rounded-xl border border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-indigo-300 group">
             <RocketOutlined className="text-slate-300 group-hover:text-indigo-400" />
          </div>
        </div>
      </div>
    </Card>
  );
};

// --- 2. 紧急需求热度 (Demand Heatmap) ---
export const DemandHeatmapWidget = ({ data = [] }: { data?: any[] }) => {
  const hasData = data && data.length > 0;
  return (
    <Card variant="borderless" className="h-full rounded-2xl shadow-sm border border-slate-50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
           <FireOutlined className="text-rose-500" />
           <Text strong className="text-[13px] font-black text-slate-700">紧急/核心需求</Text>
        </div>
        <Tag color="error" className="m-0 border-none rounded-full px-3 text-[10px]">高优</Tag>
      </div>
      {hasData ? (
        <List
          size="small"
          dataSource={data}
          renderItem={(item: any) => (
            <List.Item className="px-0 border-b-slate-50 group cursor-pointer hover:bg-slate-50/50 transition-colors rounded-lg px-2">
              <div className="flex items-center w-full">
                <div className={`w-1 h-8 rounded-full mr-3 ${item.urgency === 'urgent' ? 'bg-rose-500' : 'bg-orange-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-700 truncate">{item.title}</div>
                  <div className="text-[11px] text-slate-400">{item.company}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-indigo-600 font-bold">{item.count}人</div>
                  <div className="text-[10px] text-slate-400">待推荐</div>
                </div>
              </div>
            </List.Item>
          )}
        />
      ) : (
        <div className="py-8 text-center">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className="text-slate-400 text-[11px]">暂无紧急需求</span>} />
        </div>
      )}
      <Button
        type="link"
        block
        className="mt-2 text-slate-400 text-xs hover:text-indigo-500"
        onClick={() => window.location.href = '/jobs'}
      >
        查看全部在招岗位 <ArrowRightOutlined className="text-[10px]" />
      </Button>
    </Card>
  );
};

// --- 3. 客户跟进墙 (CRM Tracker) ---
export const ClientTrackerWidget = ({ data = [] }: { data?: any[] }) => {
  const hasData = data && data.length > 0;
  return (
    <Card variant="borderless" className="h-full rounded-2xl shadow-sm bg-gradient-to-br from-white to-indigo-50/30">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Text strong className="text-[13px] font-black text-slate-700 block text-indigo-900">核心客户跟进</Text>
          <Text className="text-[10px] text-slate-400">建立持久且深度的客户链接</Text>
        </div>
        <ShopOutlined
          className="text-xl text-indigo-200 cursor-pointer hover:text-indigo-500 transition-colors"
          onClick={() => window.location.href = '/enterprises'}
        />
      </div>

      {hasData ? (
        <div className="space-y-4">
          {data.map((client: any) => (
            <div key={client.name} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all">
               <div className="flex justify-between items-center mb-2">
                 <Text strong className="text-sm">{client.name}</Text>
                 <Tag className="m-0 border-none text-[10px] bg-indigo-50 text-indigo-500">{client.status === 'signed' ? '已签约' : '推进中'}</Tag>
               </div>
               <div className="text-[11px] text-slate-500 flex items-center">
                 <ClockCircleOutlined className="mr-1 opacity-50" /> {client.nextAction}
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className="text-slate-400 text-[11px]">暂无客户跟进数据</span>} />
        </div>
      )}
    </Card>
  );
};

// --- 4. 交付进度漏斗 (Pipeline Funnel) ---
export const PipelineFunnelWidget = ({ data = [] }: { data?: any[] }) => {
  const hasData = data && data.length > 0 && data.some((d: any) => (d.value || 0) > 0);

  return (
    <Card variant="borderless" className="h-full rounded-2xl shadow-sm" styles={{ body: { padding: 20 } }}>
      <div className="flex items-center justify-between mb-8">
        <Text strong className="text-[13px] font-black text-slate-700">人才交付看板 (全链路)</Text>
        <Badge status="processing" text={<span className="text-[10px] text-slate-400">实时交付统计</span>} />
      </div>

      {hasData ? (
        <>
          <div className="h-[220px] w-full relative min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <ReFunnelChart margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: 12 }}
                />
                <Funnel dataKey="value" data={data} isAnimationActive>
                  <LabelList position="right" fill="#64748b" stroke="none" dataKey="name" style={{ fontSize: 11 }} />
                  <LabelList position="center" fill="#fff" stroke="none" dataKey="value" style={{ fontSize: 13, fontWeight: 'bold' }} />
                </Funnel>
              </ReFunnelChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-between border-t border-slate-50 pt-4">
             <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">推荐转化</div>
                <div className="text-lg font-black text-slate-700">
                  {data.length >= 2 ? `${Math.round(((data[data.length-1]?.value || 0) / (data[0]?.value || 1)) * 100)}%` : '--'}
                </div>
             </div>
             <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">入职达成</div>
                <div className="text-lg font-black text-slate-700">
                  {data.length >= 3 ? `${Math.round(((data[data.length-1]?.value || 0) / (data[1]?.value || 1)) * 100)}%` : '--'}
                </div>
             </div>
          </div>
        </>
      ) : (
        <div className="h-[220px] flex items-center justify-center">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className="text-slate-400 text-[11px]">暂无交付数据</span>} />
        </div>
      )}
    </Card>
  );
};

// --- 5. 最新入库人才 (Latest Talent) ---
export const LatestTalentWidget = ({ data = [] }: { data?: any[] }) => {
  const hasData = data && data.length > 0;
  return (
    <Card variant="borderless" className="h-full rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <TeamOutlined className="text-indigo-500 mr-2" />
          <Text strong className="text-[13px] font-black text-slate-700">最新人才动态</Text>
        </div>
        <Button ghost type="primary" size="small" className="text-[10px] border-indigo-200 text-indigo-500 px-3 rounded-full h-6">公海发现</Button>
      </div>

      {hasData ? (
        <div className="space-y-4">
          {data.map((talent: any) => (
            <div key={talent.name} className="flex items-center group cursor-pointer">
               <Avatar src={talent.avatar} size={36} className="mr-3 border border-slate-100" style={!talent.avatar ? { backgroundColor: '#6366f1', fontWeight: 700 } : {}}>{!talent.avatar ? talent.name?.[0] : null}</Avatar>
               <div className="flex-1 min-w-0 border-b border-slate-50 pb-3 group-last:border-none">
                  <div className="flex justify-between items-start">
                     <Text strong className="text-[13px]">{talent.name}</Text>
                     <Text className="text-[10px] text-slate-400 font-mono italic">{talent.exp}</Text>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{talent.title} @{talent.company}</div>
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className="text-slate-400 text-[11px]">暂无最新人才</span>} />
        </div>
      )}
    </Card>
  );
};
