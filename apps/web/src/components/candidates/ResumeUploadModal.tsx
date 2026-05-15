'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Modal, Upload, Button, Progress, App } from 'antd';
import {
  InboxOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  CloudUploadOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const { Dragger } = Upload;

interface ResumeUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadQueueItem {
  id: string;
  name: string;
  status: 'pending' | 'queued' | 'uploading' | 'success' | 'duplicate' | 'error';
  progress: number;
  message?: string;
}

export default function ResumeUploadModal({ visible, onClose, onSuccess }: ResumeUploadModalProps) {
  const { message: antMessage } = App.useApp();
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const pendingFilesRef = useRef<File[]>([]);
  const flushTimerRef = useRef<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
      if (flushTimerRef.current) window.clearTimeout(flushTimerRef.current);
    };
  }, []);

  const openProgressStream = (batchId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    eventSourceRef.current?.close();
    const stream = new EventSource(`/api/candidates/upload-progress/${batchId}?token=${encodeURIComponent(token)}`);
    eventSourceRef.current = stream;

    stream.onmessage = (event) => {
      try {
        const envelope = JSON.parse(event.data);
        // 后端改为 envelope 格式：{type:'progress'|'heartbeat'|'connected', payload?, ts}.
        // heartbeat/connected 不更新 UI，只用来保活和确认通道。
        if (envelope?.type !== 'progress' || !envelope.payload) return;
        const progressEvent = envelope.payload;

        const isDone = ['completed', 'duplicate', 'failed'].includes(progressEvent.status);
        const nextStatus: UploadQueueItem['status'] =
          progressEvent.status === 'completed'
            ? 'success'
            : progressEvent.status === 'duplicate'
              ? 'duplicate'
              : progressEvent.status === 'failed'
                ? 'error'
                : 'uploading';

        setQueue(prev => {
          const next = prev.map(item =>
            item.id === progressEvent.jobId
              ? {
                ...item,
                status: nextStatus,
                progress: Math.max(item.progress, progressEvent.progress || 0),
                message: progressEvent.error || progressEvent.status,
              }
              : item,
          );

          if (isDone && next.every(item => ['success', 'duplicate', 'error'].includes(item.status))) {
            stream.close();
            eventSourceRef.current = null;
          }

          return next;
        });
      } catch {
        // Ignore malformed SSE payloads; the queue item will remain visible.
      }
    };

    stream.onerror = () => {
      // SSE 断开：可能是 token 过期、网络抖动或代理超时。
      // 不要把队列里的 queued/uploading 项标红 —— 后端任务大概率还在跑。
      // 让用户知道是连接问题，建议刷新查看最终结果。
      stream.close();
      eventSourceRef.current = null;
      setQueue(prev =>
        prev.map(item =>
          ['queued', 'uploading'].includes(item.status)
            ? { ...item, message: '进度连接中断，后台仍在解析，请稍后刷新列表查看结果' }
            : item,
        ),
      );
    };
  };

  const handleBatchUpload = async (files: File[]) => {
    const localItems = files.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      name: file.name,
      status: 'uploading' as const,
      progress: 3,
    }));

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    setQueue(prev => [...prev, ...localItems]);

    try {
      const res = await api.post('/candidates/batch-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || progressEvent.loaded));
          setQueue(prev =>
            prev.map(item =>
              localItems.some(local => local.id === item.id)
                ? { ...item, progress: Math.max(item.progress, Math.min(20, Math.round(percent * 0.2))) }
                : item,
            ),
          );
        },
      });

      const jobs = res.data.jobs || [];
      setQueue(prev => prev.map(item => {
        const localIndex = localItems.findIndex(local => local.id === item.id);
        if (localIndex === -1) return item;

        const job = jobs[localIndex];
        if (!job || job.status === 'rejected') {
          return {
            ...item,
            status: 'error',
            progress: 100,
            message: job?.error || '入队失败',
          };
        }

        return {
          ...item,
          id: String(job.jobId),
          status: 'queued',
          progress: 20,
          message: 'queued',
        };
      }));

      if (res.data.batchId) {
        openProgressStream(res.data.batchId);
      }
    } catch (e: any) {
      setQueue(prev => prev.map(item =>
        localItems.some(local => local.id === item.id)
          ? { ...item, status: 'error', progress: 100, message: e?.response?.data?.message || '上传入队失败' }
          : item,
      ));
    }
  };

  const scheduleBatchUpload = (file: File) => {
    pendingFilesRef.current.push(file);
    if (flushTimerRef.current) return;

    flushTimerRef.current = window.setTimeout(() => {
      const files = pendingFilesRef.current.splice(0);
      flushTimerRef.current = null;
      if (files.length > 0) {
        handleBatchUpload(files);
      }
    }, 80);
  };

  const uploadProps = {
    name: 'file',
    multiple: true,
    showUploadList: false,
    beforeUpload: (file: File) => {
      const isAllowed = /\.(pdf|docx|txt)$/i.test(file.name);
      if (!isAllowed) {
        antMessage.error(`${file.name} 格式不支持`);
        return false;
      }
      scheduleBatchUpload(file);
      return false;
    },
  };

  const currentSuccessCount = queue.filter(i => ['success', 'duplicate'].includes(i.status)).length;
  const isAnyUploading = queue.some(i => ['pending', 'queued', 'uploading'].includes(i.status));

  const handleFinished = () => {
    if (currentSuccessCount > 0) onSuccess();
    setQueue([]);
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex flex-col py-2">
          <span className="text-base font-black text-white tracking-tight flex items-center gap-2">
            <CloudUploadOutlined className="text-[#6C5CE7]" /> 人才节点导入 (Node Ingestion)
          </span>
          <span className="text-[10px] text-[#555762] font-black uppercase tracking-[0.2em] mt-0.5">Automated Multi-modal Resume Parsing</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={
        <div className="flex justify-between items-center px-8 py-4 bg-[#11131A] -mx-6 -mb-5 rounded-b-3xl border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00E676] shadow-[0_0_8px_#00E676] animate-pulse" />
            <span className="text-[10px] text-[#8B8D97] font-black uppercase tracking-widest">
              解析进度: {currentSuccessCount} / {queue.length}
            </span>
          </div>
          <Button
            type="primary"
            disabled={isAnyUploading || queue.length === 0}
            onClick={handleFinished}
            className="h-10 rounded-xl bg-[#6C5CE7] hover:bg-[#5a4cdb] border-none px-8 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-[#6C5CE7]/20 transition-all active:scale-95"
          >
            完成并同步至库
          </Button>
        </div>
      }
      width={560}
      centered
      styles={{
        content: { backgroundColor: '#0B0D11', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px' },
        header: { backgroundColor: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '0' },
        body: { padding: '32px 32px 32px' }
      }}
      closeIcon={<span className="text-[#555762] hover:text-white transition-colors">✕</span>}
    >
      <div className="space-y-8">
        <Dragger
          {...uploadProps}
          className="v2-dark-dragger group cursor-pointer overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#6C5CE7]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <p className="ant-upload-drag-icon !text-[#555762] group-hover:!text-[#6C5CE7] transition-all !mb-6 scale-125">
            <InboxOutlined />
          </p>
          <p className="text-[15px] font-black text-white/90 mb-2">批量拖拽简历至此空间</p>
          <p className="text-[10px] text-[#555762] font-black uppercase tracking-[0.15em]">支持 PDF, DOCX, TXT | AI 语义实时提取</p>
        </Dragger>

        {queue.length > 0 && (
          <div className="max-h-[340px] overflow-y-auto no-scrollbar space-y-3 pr-1">
            <AnimatePresence>
              {queue.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-4 bg-[#13161C] border border-white/5 rounded-2xl flex items-center shadow-2xl transition-all hover:border-white/10 group relative overflow-hidden"
                >
	                  <div className={cn(
	                    "w-12 h-12 rounded-xl flex items-center justify-center mr-4 shrink-0 border border-white/5 transition-all",
	                    ['success', 'duplicate'].includes(item.status) ? "bg-[#00E676]/10 text-[#00E676] border-[#00E676]/20" :
	                      item.status === 'error' ? "bg-[#FF5252]/10 text-[#FF5252] border-[#FF5252]/20" : "bg-[#6C5CE7]/10 text-[#A29BFE] border-[#6C5CE7]/20"
	                  )}>
	                    {['queued', 'uploading'].includes(item.status) ? <LoadingOutlined /> : item.name.toLowerCase().endsWith('.pdf') ? <FilePdfOutlined /> : <FileWordOutlined />}
                  </div>

                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-black text-white/80 truncate mr-2">{item.name}</span>
                      <div className="flex items-center gap-2">
                        {['queued', 'uploading'].includes(item.status) && <ThunderboltOutlined className="text-[#A29BFE] animate-pulse text-[10px]" />}
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest",
                          ['success', 'duplicate'].includes(item.status) ? "text-[#00E676]" : item.status === 'error' ? "text-[#FF5252]" : "text-[#A29BFE]"
                        )}>
                          {item.status === 'queued' ? 'Queued' : item.status === 'uploading' ? 'AI 解析中...' : item.status === 'success' ? 'Ready' : item.status === 'duplicate' ? 'Duplicate' : (item.message || 'Error')}
                        </span>
                      </div>
                    </div>
                    <Progress
                      percent={item.progress}
                      size={[-1, 3]}
                      showInfo={false}
                      strokeColor={item.status === 'error' ? '#FF5252' : ['success', 'duplicate'].includes(item.status) ? '#00E676' : { '0%': '#6C5CE7', '100%': '#00D2FF' }}
                      trailColor="rgba(255,255,255,0.02)"
                    />
                  </div>

                  {item.status === 'error' && (
                    <Button
                      size="small"
                      type="text"
                      className="text-[#555762] hover:text-[#FF5252] transition-colors"
                      icon={<DeleteOutlined />}
                      onClick={() => setQueue(q => q.filter(i => i.id !== item.id))}
                    />
                  )}
                  {['success', 'duplicate'].includes(item.status) && <CheckCircleOutlined className="text-[#00E676] text-lg" />}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Modal>
  );
}
