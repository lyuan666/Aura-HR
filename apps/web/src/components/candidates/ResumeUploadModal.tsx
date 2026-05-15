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
  ThunderboltOutlined,
  WarningOutlined,
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

interface PendingDuplicate {
  jobId: string;
  fileName: string;
  matchType: string;
  matchTypeLabel: string;
  confidence: number;
  existing: {
    id: string;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    currentCompany?: string | null;
    currentTitle?: string | null;
    updatedAt?: string | null;
    sourcePlatform?: string | null;
  };
  resolving?: 'discard' | 'replace';
}

export default function ResumeUploadModal({ visible, onClose, onSuccess }: ResumeUploadModalProps) {
  const { message: antMessage } = App.useApp();
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [pendingDuplicates, setPendingDuplicates] = useState<PendingDuplicate[]>([]);
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
        // 后端 envelope 格式：{type:'progress'|'heartbeat'|'connected', payload?, ts}.
        // heartbeat/connected 不更新 UI，只用来保活和确认通道。
        if (envelope?.type !== 'progress' || !envelope.payload) return;
        const progressEvent = envelope.payload;

        // 命中查重：把决策上下文塞到 pendingDuplicates，弹 Modal 让用户选择。
        if (progressEvent.status === 'duplicate' && progressEvent.duplicate) {
          setPendingDuplicates(prev => {
            if (prev.some(d => d.jobId === progressEvent.jobId)) return prev;
            return [
              ...prev,
              {
                jobId: progressEvent.jobId,
                fileName: progressEvent.fileName,
                matchType: progressEvent.duplicate.matchType,
                matchTypeLabel: progressEvent.duplicate.matchTypeLabel,
                confidence: progressEvent.duplicate.confidence,
                existing: progressEvent.duplicate.existing,
              },
            ];
          });
        }

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
                message:
                  progressEvent.status === 'duplicate'
                    ? `已存在：${progressEvent.duplicate?.existing?.name || '同一候选人'}`
                    : progressEvent.error || progressEvent.status,
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

  const resolveDuplicate = async (jobId: string, decision: 'discard' | 'replace') => {
    setPendingDuplicates(prev =>
      prev.map(d => (d.jobId === jobId ? { ...d, resolving: decision } : d)),
    );
    try {
      await api.post('/candidates/duplicate-decision', { jobId, decision });
      setPendingDuplicates(prev => prev.filter(d => d.jobId !== jobId));
      setQueue(prev =>
        prev.map(item =>
          item.id === jobId
            ? {
              ...item,
              status: 'success',
              progress: 100,
              message: decision === 'replace' ? '已用新简历覆盖' : '已放弃',
            }
            : item,
        ),
      );
      antMessage.success(decision === 'replace' ? '已用新简历覆盖' : '已放弃此简历');
      if (decision === 'replace') onSuccess();
    } catch (e: any) {
      setPendingDuplicates(prev =>
        prev.map(d => (d.jobId === jobId ? { ...d, resolving: undefined } : d)),
      );
      antMessage.error(e?.response?.data?.message || '操作失败，请重试');
    }
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

      {/* 重复简历决策 Modal —— 一次处理一个 dup，避免用户面对一堆决策按钮。 */}
      <Modal
        open={pendingDuplicates.length > 0}
        title={
          <span className="text-base font-black text-white tracking-tight flex items-center gap-2">
            <WarningOutlined className="text-[#FFB300]" /> 检测到重复简历
          </span>
        }
        onCancel={() => {
          // 关闭按钮 = 全部放弃；逐一调 discard。
          pendingDuplicates.forEach(d => {
            if (!d.resolving) resolveDuplicate(d.jobId, 'discard');
          });
        }}
        footer={null}
        width={520}
        centered
        styles={{
          content: { backgroundColor: '#0B0D11', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px' },
          header: { backgroundColor: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)' },
          body: { padding: '24px 28px' },
        }}
        closeIcon={<span className="text-[#555762] hover:text-white transition-colors">✕</span>}
      >
        {pendingDuplicates[0] && (() => {
          const dup = pendingDuplicates[0];
          const ex = dup.existing;
          const updated = ex.updatedAt
            ? new Date(ex.updatedAt).toLocaleString('zh-CN', { hour12: false })
            : '未知';
          return (
            <div className="space-y-5">
              <div className="text-[12px] text-[#A29BFE]">
                上传的简历 <span className="text-white">{dup.fileName}</span>{' '}
                与候选人库中已存在记录匹配（{dup.matchTypeLabel}，置信度 {(dup.confidence * 100).toFixed(0)}%）。
              </div>

              <div className="bg-[#13161C] border border-white/5 rounded-xl p-4 space-y-2">
                <div className="text-[10px] text-[#555762] font-black uppercase tracking-widest">已存在的候选人</div>
                <div className="text-sm font-black text-white">{ex.name || '(无姓名)'}</div>
                <div className="text-[11px] text-[#8B8D97] grid grid-cols-2 gap-y-1 gap-x-4 mt-2">
                  {ex.phone && <div>手机：{ex.phone}</div>}
                  {ex.email && <div>邮箱：{ex.email}</div>}
                  {ex.currentTitle && <div>职位：{ex.currentTitle}</div>}
                  {ex.currentCompany && <div>公司：{ex.currentCompany}</div>}
                  {ex.sourcePlatform && <div>来源：{ex.sourcePlatform}</div>}
                  <div>更新：{updated}</div>
                </div>
              </div>

              <div className="text-[11px] text-[#FFB300]/80 leading-relaxed">
                选择「更新」会用本次上传的新简历覆盖现有候选人的字段（姓名、电话、职位、公司、经历、技能等），原简历归档到历史记录；
                选择「放弃」则丢弃本次上传，保留库中现有版本不变。
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  onClick={() => resolveDuplicate(dup.jobId, 'discard')}
                  loading={dup.resolving === 'discard'}
                  disabled={!!dup.resolving}
                  className="h-9 rounded-lg border-white/10 bg-transparent text-white/80 hover:!text-white hover:!border-white/20 px-5"
                >
                  放弃此简历
                </Button>
                <Button
                  type="primary"
                  onClick={() => resolveDuplicate(dup.jobId, 'replace')}
                  loading={dup.resolving === 'replace'}
                  disabled={!!dup.resolving}
                  className="h-9 rounded-lg bg-[#6C5CE7] hover:!bg-[#5a4cdb] border-none px-5"
                >
                  用新简历更新
                </Button>
              </div>

              {pendingDuplicates.length > 1 && (
                <div className="text-[10px] text-[#555762] text-center">
                  还有 {pendingDuplicates.length - 1} 份重复简历待处理
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </Modal>
  );
}
