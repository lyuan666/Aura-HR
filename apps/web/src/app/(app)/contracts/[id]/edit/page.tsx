'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Card,
  Space,
  App,
  Spin,
  Progress,
  Tooltip,
  Modal,
  Alert,
  Badge,
  Tag,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  FileProtectOutlined,
  RobotOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

// Tiptap 菜单栏组件
const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="editor-toolbar" style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      padding: '10px 16px',
      borderBottom: '1px solid #e8e8e8',
      background: '#fafafa',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      alignItems: 'center',
    }}>
      <Space.Compact size="small">
        <Button
          type={editor.isActive('bold') ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={{ fontWeight: 'bold' }}
        >
          B
        </Button>
        <Button
          type={editor.isActive('underline') ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          style={{ textDecoration: 'underline' }}
        >
          U
        </Button>
        <Button
          type={editor.isActive('italic') ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          style={{ fontStyle: 'italic' }}
        >
          I
        </Button>
        <Button
          type={editor.isActive('strike') ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          style={{ textDecoration: 'line-through' }}
        >
          S
        </Button>
      </Space.Compact>

      <Divider type="vertical" />

      <Space.Compact size="small">
        <Button
          type={editor.isActive('heading', { level: 1 }) ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          H1
        </Button>
        <Button
          type={editor.isActive('heading', { level: 2 }) ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </Button>
        <Button
          type={editor.isActive('heading', { level: 3 }) ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </Button>
        <Button
          type={editor.isActive('paragraph') ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          P
        </Button>
      </Space.Compact>

      <Divider type="vertical" />

      <Space.Compact size="small">
        <Button
          type={editor.isActive('bulletList') ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          无序
        </Button>
        <Button
          type={editor.isActive('orderedList') ? 'primary' : 'default'}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          有序
        </Button>
      </Space.Compact>

      <Divider type="vertical" />

      <Space size={4}>
        <Button
          size="small"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
        >
          撤销
        </Button>
        <Button
          size="small"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
        >
          重做
        </Button>
      </Space>
    </div>
  );
};

export default function ContractEditPage() {
  const { message, modal } = App.useApp();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [contract, setContract] = useState<any>(null);

  // AI 评估状态
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStepMsg, setAiStepMsg] = useState<string>('');
  const [aiReport, setAiReport] = useState<any>(null);
  const [aiProgress, setAiProgress] = useState(0);

  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasUnsavedChangesRef = useRef(false);

  // Tiptap 初始化
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      hasUnsavedChangesRef.current = true;
      triggerAutoSave(html);
    },
  });

  // 获取草稿详情并进行 LocalStorage 备份检查
  useEffect(() => {
    async function loadContract() {
      try {
        const res = await api.get(`/contracts/generations/${id}`);
        const data = res.data;
        setContract(data);

        const currentContent = data.editedContent || data.content;

        // 检查 LocalStorage 是否有更新未保存的备份
        const localBackup = localStorage.getItem(`draft_contract_${id}`);
        if (localBackup && localBackup !== currentContent) {
          modal.confirm({
            title: '检测到未保存的本地草稿',
            content: '我们发现您的浏览器中存有一份较新的本地草稿，是否需要恢复该草稿？',
            okText: '恢复草稿',
            cancelText: '使用云端版本',
            onOk: () => {
              editor?.commands.setContent(localBackup);
              hasUnsavedChangesRef.current = true;
              triggerAutoSave(localBackup);
            },
            onCancel: () => {
              editor?.commands.setContent(currentContent);
              localStorage.removeItem(`draft_contract_${id}`);
            }
          });
        } else {
          editor?.commands.setContent(currentContent);
        }

        // 如果已有评估报告，载入展示
        if (data.riskAssessment) {
          setAiReport(data.riskAssessment);
        }
      } catch (e: any) {
        message.error('合同加载失败');
      } finally {
        setLoading(false);
      }
    }

    if (editor && id) {
      loadContract();
    }
  }, [id, editor, modal, message]);

  // 路由离开/页面关闭拦截
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current) {
        e.preventDefault();
        e.returnValue = '您有未保存的合同修改，确定要离开吗？';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // 自动防抖保存 API 调用
  const triggerAutoSave = useCallback((html: string) => {
    setSaveStatus('saving');
    localStorage.setItem(`draft_contract_${id}`, html);

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(async () => {
      try {
        await api.patch(`/contracts/generations/${id}/content`, { editedContent: html });
        setSaveStatus('saved');
        hasUnsavedChangesRef.current = false;
        // 成功写入库后清除本地草稿备份
        localStorage.removeItem(`draft_contract_${id}`);
      } catch (e) {
        setSaveStatus('error');
        message.error('自动保存失败，已临时暂存在本地草稿箱');
      }
    }, 3000); // 3 秒防抖自动同步
  }, [id, message]);

  // 手动保存
  const handleManualSave = async () => {
    if (!editor) return;
    setSaving(true);
    const html = editor.getHTML();
    try {
      await api.patch(`/contracts/generations/${id}/content`, { editedContent: html });
      setSaveStatus('saved');
      hasUnsavedChangesRef.current = false;
      localStorage.removeItem(`draft_contract_${id}`);
      message.success('合同已手动保存成功');
    } catch (e) {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 正式签署归档事务
  const handleFormalize = async () => {
    modal.confirm({
      title: '确认正式归档签署',
      content: '正式化后，当前向导草稿正文将被冻结锁定，且将正式在【合同管理列表】中生成一份生效状态的合同文件。是否继续？',
      okText: '确认签署并归档',
      cancelText: '取消',
      onOk: async () => {
        try {
          setLoading(true);
          // 在执行正式化前先保存最新正文
          if (editor) {
            const html = editor.getHTML();
            await api.patch(`/contracts/generations/${id}/content`, { editedContent: html });
          }
          await api.post(`/contracts/generations/${id}/formalize`);
          message.success('合同已成功正式签署并归档！');
          localStorage.removeItem(`draft_contract_${id}`);
          hasUnsavedChangesRef.current = false;
          router.push('/contracts');
        } catch (e: any) {
          message.error(e.response?.data?.message || '合同正式化失败');
          setLoading(false);
        }
      }
    });
  };

  // 调用系统打印
  const handlePrint = () => {
    window.print();
  };

  // 发起 AI 风险评估 SSE 接口调用
  const handleAiAssess = () => {
    setAiLoading(true);
    setAiStepMsg('正在准备审查环境...');
    setAiProgress(10);
    setAiReport(null);

    const token = localStorage.getItem('token') || '';
    // 利用 query 参数传递 JWT Token
    const sseUrl = `/api/contracts/generations/${id}/assess-risk?token=${token}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === 'error') {
          // AI 服务返回结构化错误
          setAiStepMsg(data.message || 'AI 服务暂时不可用');
          message.error(data.message || 'AI 服务暂时不可用，请稍后重试');
          eventSource.close();
          setAiLoading(false);
          return;
        }
        if (data.status === 'progress') {
          setAiStepMsg(data.message);
          setAiProgress((prev) => Math.min(prev + 15, 90));
        } else if (data.status === 'result') {
          // 单个条款维度评估结果输出
          setAiProgress((prev) => Math.min(prev + 10, 95));
        } else if (data.status === 'completed') {
          setAiReport(data.report);
          setAiProgress(100);
          setAiStepMsg('审查已全部完成');
          message.success('AI 条款合规审查完毕');
          eventSource.close();
          setAiLoading(false);
        }
      } catch (e) {
        console.error(e);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      message.error('AI 评估连接意外中断');
      eventSource.close();
      setAiLoading(false);
    };
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" tip="正在加载合同编辑器..."><div /></Spin>
      </div>
    );
  }

  // 渲染风险等级标签
  const getRiskTag = (level: string) => {
    switch (level) {
      case 'high':
        return <Tag color="error">高风险</Tag>;
      case 'medium':
        return <Tag color="warning">中风险</Tag>;
      default:
        return <Tag color="success">低风险</Tag>;
    }
  };

  return (
    <PageContainer
      header={{
        title: `微调与签署: ${contract?.generationNo}`,
        subTitle: '在线富文本微调，配合 AI 条款风险评估做合规校对',
        extra: [
          <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => router.push('/contracts')}>
            返回列表
          </Button>,
          <Button key="print" icon={<PrinterOutlined />} onClick={handlePrint}>
            打印 / 导出 PDF
          </Button>,
          <Button
            key="save"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={handleManualSave}
            disabled={saveStatus === 'saved'}
          >
            {saveStatus === 'saving' ? '正在自动保存...' : saveStatus === 'error' ? '保存出错(点击重试)' : '内容已保存'}
          </Button>,
          contract?.status !== 'formalized' && (
            <Button key="formalize" type="primary" icon={<FileProtectOutlined />} onClick={handleFormalize}>
              确认签署并归档
            </Button>
          )
        ].filter(Boolean) as React.ReactNode[],
      }}
    >
      <div className="workspace-container">
        {/* 左侧编辑器主体 */}
        <div className="editor-main-panel">
          <Card variant="borderless" styles={{ body: { padding: 0 } }} style={{ borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <MenuBar editor={editor} />
            <div className="print-container" style={{ background: '#f5f5f5', padding: '30px 10px', minHeight: '75vh', overflowY: 'auto' }}>
              <div
                className="paper-a4"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  padding: '25mm 20mm',
                  background: '#fff',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                  margin: '0 auto',
                  boxSizing: 'border-box',
                }}
              >
                <EditorContent editor={editor} />
              </div>
            </div>
          </Card>
        </div>

        {/* 右侧 AI 助手面板 */}
        <div className="sidebar-panel no-print">
          <Card
            title={
              <Space>
                <RobotOutlined style={{ color: '#722ed1' }} />
                <span style={{ fontWeight: 600 }}>AI 合法合规审查助手</span>
              </Space>
            }
            variant="borderless"
            style={{ borderRadius: 8, height: '100%', minHeight: '600px', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
            styles={{ body: { display: 'flex', flexDirection: 'column', flex: 1, padding: '20px 16px' } }}
          >
            {contract?.status === 'formalized' ? (
              <Alert
                message="合同已签署锁定"
                description="本合同已完成正式归档与签署，正文已冻结锁定，AI 助手不再提供风险分析功能。"
                type="info"
                showIcon
              />
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ color: '#666', fontSize: 13, lineHeight: '1.6' }}>
                    基于 CUAD 法律评估标准，AI 将多维度对合同中的<b>费率限额、账期逾期金、竞业禁止、管辖归属、以及解约条件</b>进行扫描，帮您预防隐藏陷阱。
                  </p>
                  {!aiLoading && !aiReport && (
                    <Button
                      type="primary"
                      icon={<RobotOutlined />}
                      onClick={handleAiAssess}
                      block
                      style={{ background: 'linear-gradient(135deg, #722ed1 0%, #1890ff 100%)', border: 'none', height: 40, borderRadius: 6, fontWeight: 500 }}
                    >
                      一键发起 AI 条款合规审查
                    </Button>
                  )}
                </div>

                {/* AI 分析中进度指示器 */}
                {aiLoading && (
                  <div style={{ textAlign: 'center', padding: '30px 10px', background: '#f9f9f9', borderRadius: 8, marginBottom: 16 }}>
                    <Progress type="circle" percent={aiProgress} strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} size={80} />
                    <div style={{ marginTop: 16, fontWeight: 500, color: '#333' }}>{aiStepMsg}</div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>这通常需要 10-15 秒左右...</div>
                  </div>
                )}

                {/* AI 报告呈现 */}
                {aiReport && (
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f5f0fe', padding: '12px 16px', borderRadius: 8, marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#722ed1', fontWeight: 600 }}>AI 合规健康评分</div>
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: aiReport.score >= 80 ? '#389e0d' : aiReport.score >= 60 ? '#d46b08' : '#cf1322' }}>
                          {aiReport.score} <span style={{ fontSize: 13, fontWeight: 'normal', color: '#666' }}>/ 100 分</span>
                        </div>
                      </div>
                      <Badge status={aiReport.score >= 80 ? 'success' : aiReport.score >= 60 ? 'warning' : 'error'} text={aiReport.score >= 80 ? '合规优异' : aiReport.score >= 60 ? '中度合规风险' : '重度风险'} />
                    </div>

                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>条款项拆解评估：</h4>

                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      {Object.entries(aiReport.dimensions || {}).map(([key, dim]: [string, any]) => {
                        const dimName = key === 'rates' ? '费率合理性' :
                                      key === 'payment' ? '付款账期及违约金' :
                                      key === 'nonSolicitation' ? '劝诱禁止条款' :
                                      key === 'jurisdiction' ? '争议解决与管辖地' : '单方面解除权';
                        return (
                          <Card
                            key={key}
                            size="small"
                            type="inner"
                            title={
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                <span style={{ fontWeight: 600 }}>{dimName}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 12, fontWeight: 'bold', color: '#111' }}>{dim.score}分</span>
                                  {getRiskTag(dim.riskLevel)}
                                </div>
                              </div>
                            }
                            style={{ borderRadius: 6 }}
                          >
                            <div style={{ fontSize: 13, marginBottom: 8 }}>
                              <span style={{ color: '#8c8c8c', marginRight: 4 }}>【摘要】</span>
                              <span style={{ color: '#262626' }}>{dim.summary}</span>
                            </div>
                            {dim.riskLevel !== 'low' && (
                              <div style={{ background: '#fff2e8', padding: '8px 10px', borderRadius: 4, borderLeft: '3px solid #ffbb96' }}>
                                <div style={{ fontSize: 12, color: '#d46b08', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <ExclamationCircleOutlined />
                                  <span>法务修改建议：</span>
                                </div>
                                <div style={{ fontSize: 12, color: '#595959', marginTop: 4, lineHeight: '1.5' }}>
                                  {dim.suggestion}
                                </div>
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </Space>

                    <div style={{ marginTop: 20, textAlign: 'center' }}>
                      <Button size="small" icon={<ReloadOutlined />} onClick={handleAiAssess}>
                        重新评估最新内容
                      </Button>
                    </div>
                  </div>
                )}

                {/* 初始未评估占位 */}
                {!aiLoading && !aiReport && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#bfbfbf', border: '1px dashed #d9d9d9', borderRadius: 8, padding: '40px 20px', background: '#fafafa' }}>
                    <RobotOutlined style={{ fontSize: 32, marginBottom: 12, color: '#d9d9d9' }} />
                    <div style={{ fontSize: 13 }}>暂无 AI 条款审查记录</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>微调正文后，一键开始进行风险审计</div>
                  </div>
                )}

                <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #f0f0f0', fontSize: 11, color: '#bfbfbf', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <InfoCircleOutlined style={{ marginTop: 2 }} />
                  <span>AI 助手审查结果仅供参考，不构成正式的法律意见，签署前请仔细核对条款内容。</span>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      <style jsx global>{`
        .workspace-container {
          display: flex;
          gap: 20px;
          align-items: flex-start;
          width: 100%;
        }

        .editor-main-panel {
          flex: 1;
          min-width: 0; /* 解决 flex 溢出问题 */
        }

        .sidebar-panel {
          width: 380px;
          flex-shrink: 0;
        }

        /* Tiptap 编辑器基础样式定义 */
        .ProseMirror {
          outline: none;
          min-height: 247mm; /* A4 297mm 减去 padding 50mm */
          font-family: SimSun, Times New Roman, serif; /* 专业合同字体设置 */
          font-size: 15px;
          line-height: 1.8;
          color: #111;
        }

        .ProseMirror p {
          margin-top: 0;
          margin-bottom: 12px;
          text-indent: 2em; /* 首行缩进 */
        }

        /* 覆盖居中的大标题 */
        .ProseMirror h1 {
          font-size: 24px;
          text-align: center;
          margin-top: 0;
          margin-bottom: 24px;
          font-weight: bold;
          text-indent: 0;
        }

        .ProseMirror h2 {
          font-size: 18px;
          margin-top: 20px;
          margin-bottom: 12px;
          font-weight: bold;
          text-indent: 0;
        }

        .ProseMirror h3 {
          font-size: 16px;
          margin-top: 16px;
          margin-bottom: 8px;
          font-weight: bold;
          text-indent: 0;
        }

        .ProseMirror ul, .ProseMirror ol {
          margin-bottom: 12px;
          padding-left: 24px;
        }

        .ProseMirror li {
          margin-bottom: 6px;
        }

        /* @media print 打印机状态排版 */
        @media print {
          .no-print,
          .ant-layout-sider,
          .ant-layout-header,
          .ant-page-header,
          .ant-pro-global-header,
          .ant-pro-layout-header,
          .ant-pro-page-container-warp,
          .ant-pro-layout-content-margin,
          .editor-toolbar,
          footer,
          .ant-btn {
            display: none !important;
          }

          body, .ant-layout, .ant-pro-layout, .ant-layout-content, .ant-pro-grid-content, .ant-pro-page-container {
            padding: 0 !important;
            margin: 0 !important;
            background: #fff !important;
            width: 100% !important;
            height: auto !important;
          }

          .print-container {
            padding: 0 !important;
            margin: 0 !important;
            background: #fff !important;
            display: block !important;
          }

          .paper-a4 {
            width: 100% !important;
            min-height: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: #fff !important;
            position: static !important;
          }
        }
      `}</style>
    </PageContainer>
  );
}
