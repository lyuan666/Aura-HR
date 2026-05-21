'use client';

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Steps, Button, Card, Form, Input, DatePicker, InputNumber, Space, App, Result, Spin, Select, Tag } from 'antd';
import {
  FileTextOutlined,
  FormOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckOutlined,
  PrinterOutlined,
  FileProtectOutlined,
} from '@ant-design/icons';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

interface VariableDefinition {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  required: boolean;
  defaultValue?: any;
  options?: string[];
  placeholder?: string;
}

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  variables: VariableDefinition[];
  version: string;
}

export default function NewContractPage() {
  const { message } = App.useApp();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  const [form] = Form.useForm();
  const [generating, setGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [enterprises, setEnterprises] = useState<any[]>([]);

  // 1. 获取模板库和企业列表
  useEffect(() => {
    async function initData() {
      try {
        const [tplRes, entRes] = await Promise.all([
          api.get('/contracts/templates'),
          api.get('/enterprises').catch(() => ({ data: [] })), // 容错处理
        ]);
        
        setTemplates(tplRes.data || []);
        
        // 兼容处理企业列表数据
        const entList = Array.isArray(entRes.data) 
          ? entRes.data 
          : (entRes.data?.items || []);
        setEnterprises(entList);
      } catch (e) {
        message.error('基础数据加载失败');
      } finally {
        setLoadingTemplates(false);
      }
    }
    initData();
  }, [message]);

  // 当选择模板变化时，重置表单并加载默认值
  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    form.resetFields();
    
    // 自动填充变量默认值
    const defaultVals: Record<string, any> = {};
    template.variables.forEach(v => {
      if (v.defaultValue !== undefined) {
        if (v.type === 'date') {
          defaultVals[v.name] = dayjs(v.defaultValue);
        } else {
          defaultVals[v.name] = v.defaultValue;
        }
      }
    });
    form.setFieldsValue(defaultVals);
    setCurrentStep(1);
  };

  // 2. 提交变量渲染合同
  const handleGenerate = async (values: any) => {
    if (!selectedTemplate) return;
    setGenerating(true);
    try {
      // 对日期类型进行格式化处理
      const formattedValues = { ...values };
      selectedTemplate.variables.forEach(v => {
        if (v.type === 'date' && values[v.name]) {
          formattedValues[v.name] = values[v.name].format('YYYY-MM-DD');
        }
      });

      // 提取关联的企业 ID (如果有的话，主要用于生成记录归档)
      const enterpriseId = values._enterpriseId || null;
      delete formattedValues._enterpriseId;

      const payload = {
        templateId: selectedTemplate.id,
        variableValues: formattedValues,
        enterpriseId,
      };

      const res = await api.post('/contracts/generations', payload);
      setGenerationResult(res.data);
      message.success('合同渲染成功');
      setCurrentStep(2);
    } catch (e: any) {
      message.error(e.response?.data?.message || '合同生成失败');
    } finally {
      setGenerating(false);
    }
  };

  // 调用系统打印完成 PDF 导出
  const handlePrint = () => {
    window.print();
  };

  // 正式化合同 (调用 Phase 2 事务接口)
  const handleFormalize = async () => {
    if (!generationResult) return;
    try {
      message.info('正在正式化归档合同...');
      await api.post(`/contracts/generations/${generationResult.id}/formalize`);
      message.success('合同已成功签署并正式归档！');
      router.push('/contracts');
    } catch (e: any) {
      message.error(e.response?.data?.message || '转换正式合同失败');
    }
  };

  return (
    <PageContainer
      header={{
        title: '在线向导生成合同',
        subTitle: '选用专业模板库，基于数据变量自动渲染合规合同',
        extra: [
          currentStep > 0 && (
            <Button 
              key="back" 
              icon={<ArrowLeftOutlined />} 
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={generating}
            >
              返回上一步
            </Button>
          ),
          currentStep === 2 && (
            <Button key="print" type="default" icon={<PrinterOutlined />} onClick={handlePrint}>
              打印 / 导出 PDF
            </Button>
          ),
          currentStep === 2 && (
            <Button key="edit" type="default" icon={<FormOutlined />} onClick={() => router.push(`/contracts/${generationResult.id}/edit`)}>
              在线编辑微调
            </Button>
          ),
          currentStep === 2 && (
            <Button key="formalize" type="primary" icon={<FileProtectOutlined />} onClick={handleFormalize}>
              完成签署 / 正式归档
            </Button>
          )
        ].filter(Boolean) as React.ReactNode[],
      }}
    >
      <div className="no-print" style={{ marginBottom: 24, background: '#fff', padding: '16px 24px', borderRadius: 8, boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)' }}>
        <Steps
          current={currentStep}
          items={[
            { title: '选择合同模板', icon: <FileTextOutlined /> },
            { title: '填写合同条款', icon: <FormOutlined /> },
            { title: '预览并下载', icon: <EyeOutlined /> },
          ]}
        />
      </div>

      {/* Step 1: 选择模板 */}
      {currentStep === 0 && (
        <div className="no-print">
          {loadingTemplates ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <Spin size="large" tip="正在加载模板库..."><div /></Spin>
            </div>
          ) : templates.length === 0 ? (
            <Result
              status="info"
              title="暂无可用合同模板"
              subTitle="请联系超级管理员在后台预置系统合同模板。"
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {templates.map(tpl => (
                <Card 
                  key={tpl.id}
                  hoverable
                  style={{ borderRadius: 8, height: '100%', display: 'flex', flexDirection: 'column' }}
                  actions={[
                    <Button type="link" key="use" icon={<ArrowRightOutlined />} onClick={() => handleSelectTemplate(tpl)}>
                      选用该模板
                    </Button>
                  ]}
                >
                  <Card.Meta
                    title={<span style={{ fontSize: 16, fontWeight: 600 }}>{tpl.name}</span>}
                    description={
                      <div style={{ minHeight: 80 }}>
                        <p style={{ margin: '4px 0 12px 0', color: '#666' }}>{tpl.description}</p>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <SelectOptionBadge type={tpl.category} />
                          <span style={{ fontSize: 12, color: '#999', alignSelf: 'center' }}>版本 v{tpl.version}</span>
                        </div>
                      </div>
                    }
                  />
                  <div style={{ marginTop: 16, borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                    <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>此模板包含的必填变量 ({tpl.variables.length}个):</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {tpl.variables.map(v => (
                        <span key={v.name} style={{ background: '#f5f5f5', color: '#666', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>
                          {v.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: 填写变量表单 */}
      {currentStep === 1 && selectedTemplate && (
        <div className="no-print" style={{ maxWidth: 800, margin: '0 auto' }}>
          <Card 
            title={
              <Space>
                <FormOutlined style={{ color: '#1677ff' }} />
                <span>配置合同正文数据 — {selectedTemplate.name}</span>
              </Space>
            }
            variant="borderless"
            style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleGenerate}
              requiredMark="optional"
            >
              {/* 内置：选择签约客户单位 */}
              <Form.Item
                name="_enterpriseId"
                label="关联签约企业"
                tooltip="关联系统中的客户企业，方便合同统一归档管理。"
              >
                <Select placeholder="选择系统已有企业名称（可选）" allowClear showSearch optionFilterProp="label">
                  {enterprises.map(ent => (
                    <Select.Option key={ent.id} value={ent.id} label={ent.name}>
                      {ent.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <div style={{ borderTop: '1px solid #f0f0f0', margin: '20px 0 16px 0', paddingTop: 16 }}>
                <h4 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600, color: '#111' }}>模板必填变量：</h4>
              </div>

              {/* 动态渲染模板的 variables 字段定义 */}
              {selectedTemplate.variables.map(v => {
                const rules = [{ required: v.required, message: `请输入 ${v.label}` }];
                
                if (v.type === 'date') {
                  return (
                    <Form.Item key={v.name} name={v.name} label={v.label} rules={rules}>
                      <DatePicker style={{ width: '100%' }} placeholder={v.placeholder || '选择日期'} />
                    </Form.Item>
                  );
                }
                
                if (v.type === 'number') {
                  return (
                    <Form.Item key={v.name} name={v.name} label={v.label} rules={rules}>
                      <InputNumber style={{ width: '100%' }} placeholder={v.placeholder || '输入数值'} />
                    </Form.Item>
                  );
                }

                if (v.type === 'textarea') {
                  return (
                    <Form.Item key={v.name} name={v.name} label={v.label} rules={rules}>
                      <Input.TextArea rows={3} placeholder={v.placeholder || `请输入${v.label}`} />
                    </Form.Item>
                  );
                }

                if (v.type === 'select' && v.options) {
                  return (
                    <Form.Item key={v.name} name={v.name} label={v.label} rules={rules}>
                      <Select placeholder={v.placeholder || '请选择'}>
                        {v.options.map(opt => (
                          <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  );
                }

                // 默认 text
                return (
                  <Form.Item key={v.name} name={v.name} label={v.label} rules={rules}>
                    <Input placeholder={v.placeholder || `请输入${v.label}`} />
                  </Form.Item>
                );
              })}

              <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<CheckOutlined />} 
                  loading={generating}
                  block
                  size="large"
                >
                  渲染生成合同草案
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      )}

      {/* Step 3: 预览生成合同并提供 A4 级纸质打印排版 */}
      {currentStep === 2 && generationResult && (
        <div>
          {/* 顶部打印警告信息，仅限屏幕显示 */}
          <div className="no-print" style={{ maxWidth: 850, margin: '0 auto 16px auto' }}>
            <Card style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ color: '#389e0d', margin: 0, fontWeight: 600 }}>🎉 合同生成完毕！已生成序列号：{generationResult.generationNo}</h4>
                  <p style={{ color: '#555', margin: '4px 0 0 0', fontSize: 13 }}>您现在可以直接在此处进行 A4 页面排版打印，或进行在线富文本微调与 AI 风控合规评估。</p>
                </div>
                <Space>
                  <Button icon={<PrinterOutlined />} onClick={handlePrint}>直接打印</Button>
                  <Button icon={<FormOutlined />} onClick={() => router.push(`/contracts/${generationResult.id}/edit`)}>在线微调正文</Button>
                  <Button type="primary" icon={<FileProtectOutlined />} onClick={handleFormalize}>正式签署归档</Button>
                </Space>
              </div>
            </Card>
          </div>

          {/* 实体信笺纸张预览区域 */}
          <div className="print-container" style={{ display: 'flex', justifyContent: 'center', background: '#eaeaea', padding: '30px 10px', minHeight: '80vh' }}>
            <div 
              className="paper-a4" 
              style={{
                width: '210mm',
                minHeight: '297mm',
                padding: '25mm 20mm',
                background: '#fff',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                boxSizing: 'border-box'
              }}
            >
              {/* 将后台渲染的 HTML 直接注入页面展示 */}
              <div 
                dangerouslySetInnerHTML={{ __html: generationResult.editedContent || generationResult.content }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* 打印专用 CSS 样式样式注入 */}
      <style jsx global>{`
        /* @media screen 预览下纸张居中以及页面效果 */
        @media screen {
          .print-container {
            background-color: #f0f2f5 !important;
          }
        }

        /* 核心：@media print 打印机状态排版 */
        @media print {
          /* 隐藏所有导航栏、多余的按钮及步骤引导 */
          .no-print, 
          .ant-layout-sider, 
          .ant-layout-header, 
          .ant-page-header, 
          .ant-pro-global-header,
          .ant-pro-layout-header,
          .ant-pro-page-container-warp,
          .ant-pro-layout-content-margin,
          footer,
          .ant-btn {
            display: none !important;
          }

          /* 清理主体容器边框和外边距，以 100% 占满 */
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

          /* 强行去掉 A4 信笺预览的四周阴影和多余尺寸限制 */
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

// 辅助标签组件
function SelectOptionBadge({ type }: { type: string }) {
  switch (type) {
    case 'labor':
      return <Tag color="blue">劳动人事</Tag>;
    case 'nda':
      return <Tag color="orange">保密合规</Tag>;
    case 'service':
      return <Tag color="green">商务合作</Tag>;
    case 'recommendation':
      return <Tag color="purple">顾问推荐</Tag>;
    default:
      return <Tag color="default">{type}</Tag>;
  }
}
