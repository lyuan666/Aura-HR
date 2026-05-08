'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button, Empty, Spin, Tag, Tooltip } from 'antd';
import {
  DownloadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileUnknownOutlined,
  PrinterOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import api from '@/lib/api';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ResumePreviewProps {
  candidateId: string;
  resumeUrl?: string;
}

interface ResumeTextPreview {
  previewType: 'text' | 'download';
  fileName: string;
  extension?: string;
  text?: string;
  format?: 'markdown' | 'plain';
  method?: string;
  message?: string;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'message' in error.response.data &&
    typeof error.response.data.message === 'string'
  ) {
    return error.response.data.message;
  }

  return fallback;
};

const ResumePreview: React.FC<ResumePreviewProps> = ({ candidateId, resumeUrl }) => {
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [downloadBlobUrl, setDownloadBlobUrl] = useState<string | null>(null);
  const pdfBlobUrlRef = useRef<string | null>(null);
  const [textPreview, setTextPreview] = useState<ResumeTextPreview | null>(null);

  const isPdf = /\.(pdf)$/i.test(resumeUrl || '');
  const isWord = /\.(doc|docx)$/i.test(resumeUrl || '');
  const isTextPreviewable = /\.(docx|txt)$/i.test(resumeUrl || '');
  const fileName = resumeUrl?.split('/').pop() || 'resume';

  const loadResumeBlob = useCallback(async () => {
    if (!candidateId || !resumeUrl) return;

    const res = await api.get(`/candidates/${candidateId}/resume`, {
      responseType: 'blob',
    });
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data]);
    return URL.createObjectURL(blob);
  }, [candidateId, resumeUrl]);

  const loadPdf = useCallback(async () => {
    setLoading(true);
    setError('');
    setTextPreview(null);

    try {
      const url = await loadResumeBlob();
      if (pdfBlobUrlRef.current) URL.revokeObjectURL(pdfBlobUrlRef.current);
      pdfBlobUrlRef.current = url || null;
      setPdfBlobUrl(url || null);
    } catch (error: unknown) {
      setError(getErrorMessage(error, '加载简历文件失败'));
    } finally {
      setLoading(false);
    }
  }, [loadResumeBlob]);

  const loadTextPreview = useCallback(async () => {
    if (!candidateId || !resumeUrl) return;
    setLoading(true);
    setError('');
    if (pdfBlobUrlRef.current) {
      URL.revokeObjectURL(pdfBlobUrlRef.current);
      pdfBlobUrlRef.current = null;
    }
    setPdfBlobUrl(null);

    try {
      const res = await api.get(`/candidates/${candidateId}/resume-preview`);
      setTextPreview(res.data || null);
    } catch (error: unknown) {
      setError(getErrorMessage(error, '加载简历预览失败'));
    } finally {
      setLoading(false);
    }
  }, [candidateId, resumeUrl]);

  useEffect(() => {
    if (isPdf) {
      loadPdf();
    } else if (isTextPreviewable || isWord) {
      loadTextPreview();
    } else {
      setTextPreview(null);
    }
  }, [candidateId, resumeUrl, isPdf, isTextPreviewable, isWord, loadPdf, loadTextPreview]);

  useEffect(() => {
    return () => {
      if (pdfBlobUrlRef.current) {
        URL.revokeObjectURL(pdfBlobUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (downloadBlobUrl) {
        URL.revokeObjectURL(downloadBlobUrl);
      }
    };
  }, [downloadBlobUrl]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const onDocumentLoadError = (err: Error) => {
    setError(err.message || 'PDF 文件加载失败');
  };

  const handlePrint = () => {
    if (!pdfBlobUrl) return;
    const printWindow = window.open(pdfBlobUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => printWindow.print();
    }
  };

  const handleDownload = useCallback(async () => {
    try {
      const url = pdfBlobUrl || downloadBlobUrl || (await loadResumeBlob());
      if (!url) return;
      if (!downloadBlobUrl && url !== pdfBlobUrl) {
        setDownloadBlobUrl(url);
      }
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
    } catch (error: unknown) {
      setError(getErrorMessage(error, '下载简历失败'));
    }
  }, [downloadBlobUrl, fileName, loadResumeBlob, pdfBlobUrl]);

  const retryPreview = isPdf ? loadPdf : loadTextPreview;

  if (!resumeUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span className="text-text-sub/50">暂未检测到原始简历附件</span>}
        />
        <p className="text-[12px] text-text-sub/30">简历文件将在上传时自动关联</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Spin />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span className="text-red-400">{error}</span>}
        />
        <Button type="primary" size="small" onClick={retryPreview}>
          重试
        </Button>
      </div>
    );
  }

  const FileIcon = isPdf ? FilePdfOutlined : isWord ? FileWordOutlined : FileUnknownOutlined;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border-subtle bg-bg-surface/50">
        <div className="flex items-center gap-2 text-[13px] text-text-sub/70">
          <FileIcon className="text-lg" />
          <span className="truncate max-w-[300px]">{fileName}</span>
          {numPages > 0 && <span className="text-text-sub/40">({numPages} 页)</span>}
        </div>
        <div className="flex items-center gap-1">
          {isPdf && (
            <>
              <Tooltip title="缩小">
                <Button
                  type="text"
                  size="small"
                  icon={<ZoomOutOutlined />}
                  onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
                  disabled={scale <= 0.5}
                />
              </Tooltip>
              <span className="text-[12px] text-text-sub/50 w-12 text-center">
                {Math.round(scale * 100)}%
              </span>
              <Tooltip title="放大">
                <Button
                  type="text"
                  size="small"
                  icon={<ZoomInOutlined />}
                  onClick={() => setScale((s) => Math.min(3, s + 0.2))}
                  disabled={scale >= 3}
                />
              </Tooltip>
              <div className="w-px h-4 bg-border-subtle mx-1" />
              <Tooltip title="打印">
                <Button type="text" size="small" icon={<PrinterOutlined />} onClick={handlePrint} />
              </Tooltip>
            </>
          )}
          <Tooltip title="下载">
            <Button type="text" size="small" icon={<DownloadOutlined />} onClick={handleDownload} />
          </Tooltip>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto bg-gray-100">
        {isPdf && pdfBlobUrl ? (
          <div className="flex flex-col items-center py-4 gap-2">
            <Document
              file={pdfBlobUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center py-12">
                  <Spin />
                </div>
              }
              error={
                <div className="flex flex-col items-center py-12 gap-3">
                  <FileUnknownOutlined style={{ fontSize: 32, opacity: 0.3 }} />
                  <span className="text-[13px] text-gray-400">{error || 'PDF 文件加载失败'}</span>
                </div>
              }
            >
              {Array.from({ length: numPages }, (_, i) => (
                <Page
                  key={i}
                  pageNumber={i + 1}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="mb-2 shadow-md"
                />
              ))}
            </Document>
          </div>
        ) : textPreview?.previewType === 'text' ? (
          <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-6">
            <div className="flex flex-wrap items-center gap-2">
              <Tag color="processing">在线文本预览</Tag>
              {textPreview.method && <Tag>{textPreview.method}</Tag>}
              {textPreview.format && <Tag>{textPreview.format}</Tag>}
            </div>
            <div className="rounded-xl border border-border-subtle bg-bg-base p-6 shadow-sm">
              <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-7 text-text-main">
                {textPreview.text || '未提取到可展示内容'}
              </pre>
            </div>
          </div>
        ) : !isPdf ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
            <FileIcon style={{ fontSize: 48, opacity: 0.3 }} />
            <p className="text-[14px] text-text-sub/50">
              {textPreview?.message || '此文件格式暂不支持在线预览'}
            </p>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
              下载文件查看
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ResumePreview;
