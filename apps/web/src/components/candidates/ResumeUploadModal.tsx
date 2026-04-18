'use client';

import React, { useState } from 'react';
import { Modal, Upload, Button, message, List, Progress, App } from 'antd';
import { 
  InboxOutlined, 
  FilePdfOutlined, 
  FileWordOutlined, 
  DeleteOutlined,
  CheckCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { cn } from '@/lib/utils';

const { Dragger } = Upload;

interface ResumeUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadQueueItem {
  id: string;
  name: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  message?: string;
}

export default function ResumeUploadModal({ visible, onClose, onSuccess }: ResumeUploadModalProps) {
  const { message: antMessage } = App.useApp();
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);

  const handleUpload = async (file: File) => {
    const id = Math.random().toString(36).substring(7);
    const newItem: UploadQueueItem = {
      id,
      name: file.name,
      status: 'uploading',
      progress: 0
    };
    
    setQueue(prev => [...prev, newItem]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/candidates/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || progressEvent.loaded));
          setQueue(prev => prev.map(item => item.id === id ? { ...item, progress: percent * 0.4 } : item)); // 上传占 40%
        }
      });

      if (res.data.success) {
        // 模拟 AI 解析过程中的内部进度 (剩余 60%)
        let aiProgress = 40;
        const interval = setInterval(() => {
          aiProgress += 15;
          if (aiProgress >= 100) {
            clearInterval(interval);
            setQueue(prev => prev.map(item => item.id === id ? { ...item, status: 'success', progress: 100 } : item));
          } else {
            setQueue(prev => prev.map(item => item.id === id ? { ...item, progress: aiProgress } : item));
          }
        }, 400);
      } else {
        setQueue(prev => prev.map(item => item.id === id ? { ...item, status: 'error', message: res.data.message } : item));
      }
    } catch (e: any) {
      setQueue(prev => prev.map(item => item.id === id ? { ...item, status: 'error', message: '服务链路超时' } : item));
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: true,
    showUploadList: false,
    beforeUpload: (file: File) => {
      const isAllowed = /\.(pdf|docx|txt)$/i.test(file.name);
      if (!isAllowed) {
        antMessage.error(`${file.name} 格式不支持，仅限 PDF/Docx/Txt`);
        return false;
      }
      handleUpload(file);
      return false;
    },
  };

  const currentSuccessCount = queue.filter(i => i.status === 'success').length;
  const isAnyUploading = queue.some(i => i.status === 'uploading' && i.progress < 100);

  const handleFinished = () => {
    if (currentSuccessCount > 0) {
      onSuccess();
    }
    setQueue([]);
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex flex-col">
          <span className="text-sm font-black text-slate-800 tracking-tight">人才库节点导入</span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Candidate Node Import</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={
        <div className="flex justify-between items-center px-6 py-3 bg-slate-50 -mx-6 -mb-5 rounded-b-2xl border-t border-slate-100">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">入库进度: {currentSuccessCount} / {queue.length}</span>
          <Button 
            type="primary" 
            disabled={isAnyUploading} 
            onClick={handleFinished}
            className="h-8 rounded-lg bg-slate-900 border-none px-6 text-[10px] font-black uppercase tracking-wider shadow-sm transition-all hover:scale-[1.02]"
          >
            完成并同步
          </Button>
        </div>
      }
      width={520}
      centered
      className="mophy-modal"
      styles={{ body: { padding: '12px 0 24px' } }}
    >
      <div className="px-6">
        <Dragger {...uploadProps} className="group !bg-slate-50/50 !border-dashed !border-2 !border-slate-200 !rounded-2xl !p-10 hover:!border-indigo-400 transition-all cursor-pointer">
          <p className="ant-upload-drag-icon !text-slate-300 group-hover:!text-indigo-400 transition-colors !mb-4">
            <InboxOutlined style={{ fontSize: 44 }} />
          </p>
          <p className="text-[13px] font-black text-slate-700 mb-1">批量拖拽简历文件至此处，或点击浏览</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">支持 PDF, Word, Txt | 智能提取人岗画像</p>
        </Dragger>

        {queue.length > 0 && (
          <div className="mt-8 max-h-[280px] overflow-y-auto no-scrollbar space-y-3">
            {queue.map(item => (
              <div key={item.id} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:border-slate-200">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center mr-4 shrink-0 transition-colors",
                  item.status === 'success' ? "bg-emerald-50 text-emerald-500" : 
                  item.status === 'error' ? "bg-rose-50 text-rose-500" : "bg-indigo-50 text-indigo-500 shadow-sm"
                )}>
                  {item.status === 'uploading' ? <LoadingOutlined /> : item.name.toLowerCase().endsWith('.pdf') ? <FilePdfOutlined /> : <FileWordOutlined />}
                </div>
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] font-black text-slate-700 truncate mr-2">{item.name}</span>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-tight",
                      item.status === 'success' ? "text-emerald-500" : item.status === 'error' ? "text-rose-500" : "text-indigo-500"
                    )}>
                      {item.status === 'uploading' ? 'AI 深度理解中...' : item.status === 'success' ? '已入库' : '解析异常'}
                    </span>
                  </div>
                  <Progress 
                    percent={item.progress} 
                    size="small" 
                    showInfo={false} 
                    strokeColor={item.status === 'error' ? '#f43f5e' : item.status === 'success' ? '#10b981' : { '0%': '#6366f1', '100%': '#a855f7' }}
                    trailColor="#f1f5f9"
                    strokeWidth={4}
                  />
                </div>
                {item.status === 'error' && (
                  <Button 
                    size="small" 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined className="text-xs" />} 
                    onClick={() => setQueue(q => q.filter(i => i.id !== item.id))}
                  />
                )}
                {item.status === 'success' && <CheckCircleOutlined className="text-emerald-500" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
