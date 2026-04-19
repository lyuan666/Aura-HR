'use client';

import React, { useState, useEffect } from 'react';
import { Input, Button, Table, Space, Avatar, Empty, Pagination, App, Divider, Tooltip, Upload } from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  BarsOutlined,
  AppstoreOutlined,
  PlusOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import CandidateDetailDrawer from '@/components/candidates/CandidateDetailDrawer';
import { HolographicCard } from '@/components/candidates/HolographicCard';
import ResumeUploadModal from '@/components/candidates/ResumeUploadModal';

// 左侧过滤分组组件
const FilterMenu = ({ title, options, activeItem }: { title: string, options: string[], activeItem?: string }) => {
  // 这里的 count 以后可对接真实 API，目前使用确定的 Mock 值避免水和报错
  const getStableCount = (opt: string) => {
    const hash = opt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 20) + 1;
  };

  return (
    <div className="mb-8">
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">{title}</div>
      <div className="space-y-1">
        {options.map(opt => (
          <div 
            key={opt} 
            className={cn(
              "px-4 py-2 text-sm rounded-xl cursor-pointer transition-all flex justify-between items-center group",
              opt === activeItem ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-100/50 hover:pl-5 font-medium"
            )}
          >
            <span>{opt}</span>
            <span className={cn(
              "text-[9px] px-1.5 py-0.5 rounded-md",
              opt === activeItem ? "bg-white/20" : "bg-slate-100 group-hover:bg-slate-200"
            )}>
              {getStableCount(opt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function CandidatesPage() {
  const { message } = App.useApp();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'holographic' | 'table'>('holographic');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/candidates');
      // 处理 mock 数据用于全息卡片展示
      const enhanced = res.data.map((c: any) => ({
        ...c,
        avatar: c.avatar || null,
        experienceYears: c.totalYears || 5,
        workExperiences: c.workExperiences || [
          { company: '阿里巴巴', position: '技术专家', period: '2022.01-至今' },
          { company: '腾讯', position: '高级工程师', period: '2019.06-2021.12' }
        ],
        educationHistory: c.educationHistory || [
          { school: '浙江大学', degree: '硕士', major: '计算机科学' }
        ],
        lastUpdate: new Date(c.updatedAt).toLocaleDateString()
      }));
      setCandidates(enhanced);
    } catch (e) {
      message.error('数据流链接失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleCandidateClick = (candidate: any) => {
    setSelectedCandidate(candidate);
    setIsDrawerOpen(true);
  };

  const columns = [
    {
      title: '基本信息',
      key: 'info',
      render: (_: any, record: any) => (
        <Space>
          <Avatar src={record.avatar} style={!record.avatar ? { backgroundColor: '#6366f1', fontWeight: 700 } : {}}>{!record.avatar ? record.name?.[0] || '' : null}</Avatar>
          <span className="font-bold text-slate-800">{record.name}</span>
        </Space>
      ),
    },
    { title: '最近雇主', dataIndex: 'currentCompany', key: 'company' },
    { title: '职位', dataIndex: 'currentJob', key: 'job' },
    { title: '更新时间', dataIndex: 'lastUpdate', key: 'update' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button type="link" onClick={() => handleCandidateClick(record)}>查看</Button>
      ),
    },
  ];

  const handleImport = async (info: any) => {
    const { file } = info;
    if (file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (file.status === 'done' || file.status === 'error' || file.originFileObj) {
      const formData = new FormData();
      formData.append('file', file.originFileObj || file);
      
      try {
        setLoading(true);
        const res = await api.post('/candidates/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
          message.success('简历已提交 AI 深度解析并成功入库');
          fetchCandidates();
        } else {
          message.error('解析失败: ' + res.data.message);
        }
      } catch (e) {
        message.error('由于后端网关抖动，人才导入链路请求失败');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-112px)]">
      {/* 1. 操作栏 (ActionBar) */}
      <div className="bg-white border-b border-slate-100 flex items-center justify-between px-8 py-4 shrink-0 rounded-t-3xl">
        <div className="flex items-center space-x-6">
          <div className="flex flex-col">
            <span className="text-sm font-black text-slate-800 tracking-tight">人才库</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Candidate Matrix</span>
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
            <Tooltip title="全息矩阵视图">
              <Button 
                type={viewMode === 'holographic' ? 'primary' : 'text'} 
                icon={<BarsOutlined />} 
                onClick={() => setViewMode('holographic')}
                className={cn("h-7 rounded-lg px-4 text-xs font-bold", viewMode === 'holographic' ? "bg-slate-900 border-none shadow-sm" : "text-slate-400")}
              >
                全息
              </Button>
            </Tooltip>
            <Tooltip title="标准表格视图">
              <Button 
                type={viewMode === 'table' ? 'primary' : 'text'} 
                icon={<AppstoreOutlined />} 
                onClick={() => setViewMode('table')}
                className={cn("h-7 rounded-lg px-4 text-xs font-bold", viewMode === 'table' ? "bg-slate-900 border-none shadow-sm" : "text-slate-400")}
              >
                表格
              </Button>
            </Tooltip>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Input 
            prefix={<SearchOutlined className="text-slate-300" />} 
            placeholder="全文检索..." 
            className="w-56 h-9 border-slate-100 bg-slate-50 rounded-lg text-xs"
          />
          <Button icon={<FilterOutlined />} className="h-9 px-3 rounded-lg border-slate-100 text-xs font-bold">筛选</Button>
          <Button onClick={fetchCandidates} icon={<ReloadOutlined />} className="h-9 w-9 rounded-lg border-slate-100" />
          <Divider type="vertical" className="h-6" />
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            loading={loading}
            onClick={() => setIsUploadModalOpen(true)}
            className="h-9 px-4 rounded-lg bg-indigo-600 border-none shadow-sm text-xs font-bold"
          >
            导入简历
          </Button>
        </div>
      </div>

      {/* 2. 内容区 (Body with Sidebar) */}
      <div className="flex-1 flex overflow-hidden bg-white rounded-b-3xl">
        {/* 左侧侧边栏 */}
        {/* 左侧侧边栏 - 已根据需求由 w-64 压缩至 w-52 */}
        <div className="w-52 border-r border-slate-50 overflow-y-auto no-scrollbar py-8 px-6 bg-slate-50/20">
          <FilterMenu title="核心视图" options={['全部人才', '我的收藏', '最近联系', '待筛选']} activeItem="全部人才" />
          <FilterMenu title="行业人才" options={['互联网/大厂', '金融科技', '医疗健康', '新能源']} />
        </div>

        {/* 右侧主内容 */}
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-white">
          <AnimatePresence mode="wait">
            {viewMode === 'holographic' ? (
              <motion.div 
                key="holographic"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-5xl mx-auto space-y-2"
              >
                {candidates.map(candidate => (
                  <HolographicCard 
                    key={candidate.id} 
                    candidate={candidate} 
                    onClick={() => handleCandidateClick(candidate)} 
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="table"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Table 
                  columns={columns} 
                  dataSource={candidates} 
                  rowKey="id" 
                  loading={loading}
                  pagination={{ pageSize: 8 }}
                  className="mophy-table"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {!loading && candidates.length === 0 && (
            <div className="mt-32">
              <Empty description="未发现符合条件的高级精英" />
            </div>
          )}
          
          {!loading && candidates.length > 0 && (
            <div className="mt-12 flex justify-center pb-8">
              <Pagination total={candidates.length} pageSize={20} size="small" />
            </div>
          )}
        </div>
      </div>

      <CandidateDetailDrawer 
        visible={isDrawerOpen} 
        candidate={selectedCandidate} 
        onClose={() => setIsDrawerOpen(false)} 
      />
      <ResumeUploadModal 
        visible={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onSuccess={fetchCandidates} 
      />
    </div>
  );
}
