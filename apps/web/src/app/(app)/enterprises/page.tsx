'use client';

import React, { useRef, useState } from 'react';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Button, Space, App, Avatar, Form, Input, Modal } from 'antd';
import {
  PlusOutlined,
  GlobalOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface EnterpriseListItem {
  id: string;
  name?: string;
  industry?: string;
  status?: string;
  activeJobCount?: number;
  pendingCandidateCount?: number;
}

export default function EnterprisesPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const actionRef = useRef<ActionType>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [toolbarKeyword, setToolbarKeyword] = useState('');
  const [form] = Form.useForm();

  const statusMap = {
    signed: { text: '已签约', status: 'success' },
    negotiating: { text: '商务谈判', status: 'warning' },
    following: { text: '跟进中', status: 'processing' },
    potential: { text: '潜在客户', status: 'default' },
    churned: { text: '已流失', status: 'error' },
  };

  const columns: ProColumns<EnterpriseListItem>[] = [
    {
      title: '企业名称',
      dataIndex: 'name',
      key: 'name',
      copyable: false,
      render: (_, record) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1677ff' }}>{record.name?.[0] || 'E'}</Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{record.name || '未命名企业'}</div>
            <Space size={8} style={{ marginTop: 2 }}>
              <span style={{ fontSize: 12, color: '#999' }}>
                <GlobalOutlined style={{ marginRight: 4 }} />{record.industry || '未知行业'}
              </span>
            </Space>
          </div>
        </Space>
      ),
    },
    {
      title: '合作状态',
      dataIndex: 'status',
      key: 'status',
      valueType: 'select',
      valueEnum: statusMap,
      width: 120,
    },
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry',
      hideInSearch: true,
      width: 120,
    },
    {
      title: '活跃岗位',
      key: 'activeJobCount',
      hideInSearch: true,
      width: 100,
      render: (_, record) => (
        <span>{record.activeJobCount || 0}</span>
      ),
    },
    {
      title: '待面试',
      key: 'pendingCandidateCount',
      hideInSearch: true,
      width: 100,
      render: (_, record) => (
        <span>{record.pendingCandidateCount || 0}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      hideInSearch: true,
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          onClick={(event) => {
            event.stopPropagation();
            router.push(`/enterprises/${record.id}`);
          }}
        >
          查看详情
        </Button>
      ),
    },
  ];

  const handleCreateEnterprise = async () => {
    try {
      const values = await form.validateFields();
      setCreating(true);
      await api.post('/enterprises', values);
      message.success('客户已创建');
      setCreateOpen(false);
      form.resetFields();
      actionRef.current?.reload();
    } catch (error: unknown) {
      if (!(error && typeof error === 'object' && 'errorFields' in error)) {
        message.error('创建客户失败');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <PageContainer
        header={{
          title: '客户矩阵',
          subTitle: '企业客户管理',
          extra: [
            <Button
              key="create"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateOpen(true)}
            >
              新增客户
            </Button>,
          ],
        }}
      >
      <ProTable
        columns={columns}
        actionRef={actionRef}
        cardBordered
        request={async (params) => {
          try {
            const res = await api.get('/enterprises', {
              params: {
                page: params.current,
                pageSize: params.pageSize,
                name: params.name || toolbarKeyword || undefined,
                status: params.status || undefined,
              },
            });
            const responseData = res.data?.data || res.data || {};
            const items = responseData.items || (Array.isArray(responseData) ? responseData : []);
            return {
              data: items,
              success: true,
              total: responseData.meta?.totalItems || items.length || 0,
            };
          } catch {
            message.error('客户数据加载失败');
            return { data: [], success: false };
          }
        }}
        rowKey="id"
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
        }}
        onRow={(record) => ({
          onClick: () => router.push(`/enterprises/${record.id}`),
          style: { cursor: 'pointer' },
        })}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
        dateFormatter="string"
        toolbar={{
          search: {
            placeholder: '搜索客户名称',
            onSearch: (value: string) => {
              setToolbarKeyword(value.trim());
              actionRef.current?.reload();
            },
          },
          actions: [
            <Button
              key="reload"
              icon={<ReloadOutlined />}
              onClick={() => actionRef.current?.reload()}
            >
              刷新
            </Button>,
          ],
        }}
        options={{ reload: true, density: true, setting: true }}
      />
      </PageContainer>

      <Modal
        title="新增客户"
        open={createOpen}
        onCancel={() => {
          setCreateOpen(false);
          form.resetFields();
        }}
        onOk={handleCreateEnterprise}
        confirmLoading={creating}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="企业名称"
            name="name"
            rules={[{ required: true, message: '请输入企业名称' }]}
          >
            <Input placeholder="例如：天选科技" />
          </Form.Item>
          <Form.Item label="所属行业" name="industry">
            <Input placeholder="例如：互联网 / 金融科技" />
          </Form.Item>
          <Form.Item label="企业规模" name="scale">
            <Input placeholder="例如：100-499人" />
          </Form.Item>
          <Form.Item label="联系人姓名" name="contactName">
            <Input placeholder="例如：张经理" />
          </Form.Item>
          <Form.Item label="联系人职位" name="contactTitle">
            <Input placeholder="例如：招聘负责人" />
          </Form.Item>
          <Form.Item label="联系电话" name="contactPhone">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item label="官网" name="website">
            <Input placeholder="https://example.com" />
          </Form.Item>
          <Form.Item label="办公地址" name="address">
            <Input placeholder="请输入办公地址" />
          </Form.Item>
          <Form.Item label="企业简介" name="description">
            <Input.TextArea rows={4} placeholder="补充客户背景、招聘方向或合作备注" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
