import React, { useState } from 'react';
import { Modal, Form, Input, Button, App, Alert } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import api from '@/lib/api';

interface EnterpriseFeishuImportModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EnterpriseFeishuImportModal({ visible, onClose, onSuccess }: EnterpriseFeishuImportModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const handleImport = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const res = await api.post('/enterprises/feishu-import', {
        appToken: values.appToken,
        tableId: values.tableId,
      });

      if (res.data?.success) {
        message.success(res.data.message || '导入成功');
        form.resetFields();
        onSuccess();
        onClose();
      } else {
        message.error(res.data?.message || '导入失败');
      }
    } catch (err: any) {
      if (err.name === 'ValidationError') return;
      message.error(err.response?.data?.message || '导入异常，请检查表格配置');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <FileTextOutlined className="text-blue-500" />
          <span>从飞书多维表格导入客户数据</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      onOk={handleImport}
      confirmLoading={loading}
      okText="开始导入"
      cancelText="取消"
      width={520}
    >
      <Alert
        type="info"
        showIcon
        className="mb-4"
        message="客户矩阵导入说明"
        description={
          <div>
            <p>支持字段映射（飞书列名）：</p>
            <ul className="pl-4 list-disc text-xs">
              <li>企业名称 / 公司名称</li>
              <li>行业 / Industry</li>
              <li>规模 / Scale</li>
              <li>地址 / Address</li>
              <li>联系人 / 姓名</li>
              <li>联系电话 / 电话</li>
            </ul>
            <p className="mt-2">请确保飞书应用已被添加为表格协作者。</p>
          </div>
        }
      />
      <Form form={form} layout="vertical">
        <Form.Item 
          name="appToken" 
          label="Base ID (多维表格 ID)" 
          rules={[{ required: true, message: '请输入多维表格 Base ID' }]}
        >
          <Input placeholder="例如: MkrwbNJbwa7lzbs04c4cTDnxn3g" />
        </Form.Item>
        <Form.Item 
          name="tableId" 
          label="Table ID (数据表 ID)" 
          rules={[{ required: true, message: '请输入数据表 Table ID' }]}
        >
          <Input placeholder="例如: tbl6k2yn1MM3Rs9m" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
