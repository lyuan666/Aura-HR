import React, { useState } from 'react';
import { Modal, Form, Input, Button, App } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import api from '@/lib/api';

interface FeishuImportModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FeishuImportModal({ visible, onClose, onSuccess }: FeishuImportModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const handleImport = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const res = await api.post('/candidates/feishu-import', values);
      if (res.data?.success) {
        message.success(res.data.message || '导入成功');
        form.resetFields();
        onSuccess();
        onClose();
      } else {
        message.error(res.data?.message || '导入失败');
      }
    } catch (err: any) {
      if (err.name === 'ValidationError') return; // form validation error
      message.error(err.response?.data?.message || '导入异常，请检查授权码或网络');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <FileTextOutlined className="text-brand-primary" />
          <span>从飞书多维表格导入数据</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      onOk={handleImport}
      confirmLoading={loading}
      okText="开始导入"
      cancelText="取消"
      width={500}
    >
      <div className="my-4 text-text-sub text-sm bg-bg-surface p-3 rounded-md border border-border-subtle">
        请提供飞书个人凭证（Personal Token）及多维表格信息。
      </div>
      <Form form={form} layout="vertical">
        <Form.Item 
          name="appToken" 
          label="Base ID (appToken)" 
          rules={[{ required: true, message: '请输入 Base ID' }]}
        >
          <Input placeholder="例如: MkrwbNJbwa7lzbs04c4cTDnxn3g" />
        </Form.Item>
        <Form.Item 
          name="tableId" 
          label="Table ID (数据表 ID)" 
          rules={[{ required: true, message: '请输入 Table ID' }]}
        >
          <Input placeholder="例如: tbl6k2yn1MM3Rs9m" />
        </Form.Item>
        <Form.Item 
          name="personalToken" 
          label="授权码 (Personal Base Token)" 
          rules={[{ required: true, message: '请输入授权码' }]}
        >
          <Input.Password placeholder="pt-..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}
