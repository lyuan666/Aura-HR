'use client';

import React, { useState, useRef } from 'react';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Button, Tag, Space, App, Alert, Modal, Upload, Form, Input, DatePicker, Drawer, Card, Typography } from 'antd';
import {
  PlusOutlined,
  DownloadOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  InboxOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import api from '@/lib/api';

const { Dragger } = Upload;
const { Text, Paragraph } = Typography;

const STATUS_MAP: Record<string, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'default' },
  pending_approval: { text: '待审批', color: 'processing' },
  active: { text: '生效中', color: 'success' },
  completed: { text: '已完成', color: 'default' },
  terminated: { text: '已终止', color: 'error' },
};

const TEMPLATES = [
  { id: 'labor', name: '劳动合同模板', desc: '标准劳动合同，适用于全职员工录用', icon: <FilePdfOutlined style={{ fontSize: 32, color: '#1677ff' }} /> },
  { id: 'service', name: '服务协议模板', desc: '猎头服务合作协议，适用于客户签约', icon: <FilePdfOutlined style={{ fontSize: 32, color: '#52c41a' }} /> },
  { id: 'nda', name: '保密协议模板', desc: '保密及竞业限制协议', icon: <FilePdfOutlined style={{ fontSize: 32, color: '#fa8c16' }} /> },
  { id: 'recommendation', name: '候选人推荐函模板', desc: '正式候选人推荐信函格式', icon: <FilePdfOutlined style={{ fontSize: 32, color: '#722ed1' }} /> },
];

export default function ContractsPage() {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [form] = Form.useForm();

  const handleUpload = async (values: any) => {
    if (fileList.length === 0) {
      message.warning('请上传合同文件');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', fileList[0].originFileObj);
      formData.append('title', values.title || '');
      formData.append('contractNo', values.contractNo || '');
      formData.append('amount', values.amount || '0');
      if (values.startDate) formData.append('startDate', values.startDate.format('YYYY-MM-DD'));
      if (values.endDate) formData.append('endDate', values.endDate.format('YYYY-MM-DD'));
      if (values.notes) formData.append('notes', values.notes);

      await api.post('/contracts/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      message.success('合同上传成功');
      setUploadModalOpen(false);
      setFileList([]);
      form.resetFields();
      actionRef.current?.reload();
    } catch (e: any) {
      message.error(e.response?.data?.message || '合同上传失败');
    } finally {
      setUploading(false);
    }
  };

  const columns: ProColumns[] = [
    {
      title: '合同名称',
      dataIndex: 'title',
      key: 'title',
      render: (_, record: any) => (
        <Space>
          <FileTextOutlined style={{ color: '#1677ff' }} />
          <div>
            <div style={{ fontWeight: 600 }}>{record.title || '未命名合同'}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.contractNo || ''}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      hideInSearch: true,
      width: 120,
      render: (_, record: any) => (
        <span style={{ color: '#fa8c16', fontWeight: 600 }}>
          {record.amount ? `¥${Number(record.amount).toLocaleString()}` : '--'}
        </span>
      ),
    },
    {
      title: '有效期',
      key: 'period',
      hideInSearch: true,
      width: 180,
      render: (_, record: any) => {
        const start = record.startDate ? new Date(record.startDate).toLocaleDateString('zh-CN') : '--';
        const end = record.endDate ? new Date(record.endDate).toLocaleDateString('zh-CN') : '--';
        return <Text type="secondary" style={{ fontSize: 13 }}>{start} ~ {end}</Text>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(STATUS_MAP).map(([k, v]) => [k, { text: v.text, status: v.color === 'success' ? 'Success' : v.color === 'error' ? 'Error' : v.color === 'processing' ? 'Processing' : 'Default' }])
      ),
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      hideInSearch: true,
      width: 80,
      render: (_, record: any) => (
        <Button type="link" size="small">查看</Button>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: '合同管理',
        subTitle: '法务合规与协议管理',
        extra: [
          <Button key="template" icon={<DownloadOutlined />} onClick={() => setTemplateDrawerOpen(true)}>协议模板库</Button>,
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => setUploadModalOpen(true)}>上传合同</Button>,
        ],
      }}
    >
      <Alert
        message={
          <Space>
            <SafetyCertificateOutlined />
            <span>协议资产安全监控中 — 系统检测到期合同将自动预警</span>
          </Space>
        }
        type="info"
        showIcon={false}
        style={{ marginBottom: 16 }}
      />

      <ProTable
        columns={columns}
        actionRef={actionRef}
        cardBordered
        request={async (params) => {
          try {
            const res = await api.get('/contracts', { params });
            const items = Array.isArray(res.data) ? res.data : (res.data?.items || []);
            return {
              data: items,
              success: true,
              total: res.data?.total || items.length,
            };
          } catch (e) {
            message.error('合同数据加载失败');
            return { data: [], success: false };
          }
        }}
        rowKey="id"
        search={{
          labelWidth: 'auto',
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
        dateFormatter="string"
        toolbar={{
          search: {
            onSearch: (value: string) => {
              console.log('search', value);
            },
          },
        }}
      />

      {/* Upload Modal */}
      <Modal
        title="上传合同"
        open={uploadModalOpen}
        onCancel={() => { setUploadModalOpen(false); setFileList([]); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={uploading}
        okText="确认上传"
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleUpload}>
          <Form.Item label="合同文件" required>
            <Dragger
              maxCount={1}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={() => false}
              accept=".pdf,.docx,.doc,.jpg,.png"
            >
              <p className="ant-upload-drag-icon"><InboxOutlined /></p>
              <p>点击或拖拽合同文件至此</p>
              <p style={{ color: '#999', fontSize: 12 }}>支持 PDF、DOCX、JPG、PNG</p>
            </Dragger>
          </Form.Item>
          <Form.Item name="title" label="合同名称" rules={[{ required: true, message: '请输入合同名称' }]}>
            <Input placeholder="例如：与XX公司猎头服务协议" />
          </Form.Item>
          <Form.Item name="contractNo" label="合同编号">
            <Input placeholder="自动生成，也可手动填写" />
          </Form.Item>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="amount" label="合同金额">
              <Input placeholder="0" style={{ width: 200 }} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="startDate" label="开始日期">
              <DatePicker />
            </Form.Item>
            <Form.Item name="endDate" label="结束日期">
              <DatePicker />
            </Form.Item>
          </Space>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} placeholder="可选备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Template Drawer */}
      <Drawer
        title="协议模板库"
        open={templateDrawerOpen}
        onClose={() => setTemplateDrawerOpen(false)}
        width={480}
      >
        <Paragraph type="secondary" style={{ marginBottom: 24 }}>
          选择模板后可下载使用，模板均为通用版本，建议根据实际业务需求调整。
        </Paragraph>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {TEMPLATES.map(t => (
            <Card key={t.id} hoverable style={{ borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flexShrink: 0 }}>{t.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.name}</div>
                  <Text type="secondary" style={{ fontSize: 13 }}>{t.desc}</Text>
                </div>
                <Button type="link" icon={<DownloadOutlined />}>下载</Button>
              </div>
            </Card>
          ))}
        </Space>
      </Drawer>
    </PageContainer>
  );
}
