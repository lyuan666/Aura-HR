'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ResponsiveGridLayout, useContainerWidth, Layout } from 'react-grid-layout';
import { Button, Space, message, Drawer, Checkbox, Typography, Divider } from 'antd';
import { 
  SaveOutlined, 
  SettingOutlined, 
  ReloadOutlined,
  AppstoreAddOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { 
  QuickNavWidget, 
  DemandHeatmapWidget, 
  ClientTrackerWidget, 
  PipelineFunnelWidget, 
  LatestTalentWidget 
} from './DashboardWidgets';

const { Text, Title } = Typography;


const DEFAULT_LAYOUTS: { [key: string]: Layout[] } = {
  lg: [
    { i: 'quick-nav', x: 0, y: 0, w: 6, h: 4 },
    { i: 'funnel', x: 6, y: 0, w: 6, h: 10 },
    { i: 'demands', x: 0, y: 4, w: 6, h: 10 },
    { i: 'clients', x: 0, y: 14, w: 6, h: 8 },
    { i: 'talent', x: 6, y: 10, w: 6, h: 12 },
  ]
};

const WIDGET_COMPONENTS: { [key: string]: React.ReactNode } = {
  'quick-nav': <QuickNavWidget />,
  'demands': <DemandHeatmapWidget />,
  'clients': <ClientTrackerWidget />,
  'funnel': <PipelineFunnelWidget />,
  'talent': <LatestTalentWidget />,
};

const WIDGET_NAMES: { [key: string]: string } = {
  'quick-nav': '快捷入口',
  'demands': '紧急需求墙',
  'clients': '大客户跟进',
  'funnel': '交付全链路漏斗',
  'talent': '新入库人才',
};

export default function DashboardContainer() {
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>(DEFAULT_LAYOUTS);
  const [visibleWidgets, setVisibleWidgets] = useState<string[]>(Object.keys(WIDGET_COMPONENTS));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // 使用新版 hook 获取容器宽度
  const { width, containerRef, mounted } = useContainerWidth();

  // 加载布局
  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const res = await axios.get('/api/auth/profile');
        if (res.data?.dashboardLayoutConfig) {
          const config = res.data.dashboardLayoutConfig;
          if (config.layouts) setLayouts(config.layouts);
          if (config.visibleWidgets) setVisibleWidgets(config.visibleWidgets);
        }
      } catch (e) {
        console.error('Failed to load layout from account', e);
      } finally {
        setLoading(false);
      }
    };
    fetchLayout();
  }, []);

  const onLayoutChange = (currentLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    // 自动保存本地，不实时推送到后端，由用户手动点击“保存配置”或切页时保存
    setLayouts(allLayouts);
  };

  const handleSaveLayout = async () => {
    setSaving(true);
    try {
      await axios.post('/api/auth/layout', {
        layouts,
        visibleWidgets
      });
      message.success('仪表盘布局已同步至您的账号');
    } catch (e) {
      message.error('保存失败，请检查网络');
    } finally {
      setSaving(false);
    }
  };

  const toggleWidget = (key: string) => {
    setVisibleWidgets(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const resetLayout = () => {
    setLayouts(DEFAULT_LAYOUTS);
    setVisibleWidgets(Object.keys(WIDGET_COMPONENTS));
    message.info('布局已重置为默认');
  };

  if (loading) return null;

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex justify-between items-center mb-6 px-4">
        <div>
          <Title level={2} className="m-0 font-black tracking-tight text-slate-800">运营中心</Title>
          <Text className="text-slate-400 text-sm italic">数据实时驱动招聘闭环</Text>
        </div>
        <Space>
          <Button 
            icon={<AppstoreAddOutlined />} 
            onClick={() => setIsDrawerOpen(true)}
            className="rounded-xl border-slate-200"
          >
            管理组件
          </Button>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={resetLayout}
            className="rounded-xl border-slate-200"
          />
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            loading={saving}
            onClick={handleSaveLayout}
            className="rounded-xl bg-slate-900 border-none shadow-lg shadow-slate-200 px-6 font-bold"
          >
            保存配置
          </Button>
        </Space>
      </div>

      {mounted && (
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          width={width}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={30}
          draggableHandle=".ant-card-head, .widget-drag-handle"
          onLayoutChange={onLayoutChange}
          margin={[20, 20]}
        >
          {visibleWidgets.map(key => (
            <div key={key} className="overflow-hidden">
               <div className="widget-drag-handle absolute top-0 left-0 right-0 h-4 cursor-move z-10 hover:bg-indigo-50/50 transition-colors" title="拖拽此处移动组件" />
               {WIDGET_COMPONENTS[key]}
            </div>
          ))}
        </ResponsiveGridLayout>
      )}


      <Drawer
        title={<div className="font-black text-slate-700">仪表盘组件库</div>}
        placement="right"
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        className="mophy-drawer"
        width={320}
      >
        <div className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest px-2">业务三支柱 · 模块</div>
        <div className="space-y-2">
          {Object.keys(WIDGET_NAMES).map(key => (
            <div 
              key={key} 
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${visibleWidgets.includes(key) ? 'border-indigo-100 bg-indigo-50/30' : 'border-slate-100 grayscale opacity-60'}`}
              onClick={() => toggleWidget(key)}
            >
              <div className="flex items-center">
                 <Checkbox checked={visibleWidgets.includes(key)} className="mr-3" />
                 <Text strong className={visibleWidgets.includes(key) ? 'text-indigo-600' : 'text-slate-500'}>{WIDGET_NAMES[key]}</Text>
              </div>
            </div>
          ))}
        </div>
        
        <Divider className="my-8" />
        <div className="p-4 bg-slate-50 rounded-2xl">
           <Text className="text-[11px] text-slate-400 italic">
              提示：您可以自由拖拽组件边缘来调整其占据的大小，布局会自动保存至您的个人偏好设置中。
           </Text>
        </div>
      </Drawer>
    </div>
  );
}
