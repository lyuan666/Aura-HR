'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Button, Tag, Space, App, Avatar, Card, Row, Col, Statistic } from 'antd';
import {
  PlusOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function EnterprisesPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const actionRef = useRef<ActionType>(null);

  const statusMap = {
    signed: { text: '已签约', status: 'success' },
    negotiating: { text: '商务谈判', status: 'warning' },
    following: { text: '跟进中', status: 'processing' },
    potential: { text: '潜在客户', status: 'default' },
    churned: { text: '已流失', status: 'error' },
  };

  const columns: ProColumns[] = [
    {
      title: '企业名称',
      dataIndex: 'name',
      key: 'name',
      render: (_, record: any) => (
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
      render: (_, record: any) => (
        <span>{record.activeJobCount || 0}</span>
      ),
    },
    {
      title: '待面试',
      key: 'pendingCandidateCount',
      hideInSearch: true,
      width: 100,
      render: (_, record: any) => (
        <span>{record.pendingCandidateCount || 0}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      hideInSearch: true,
      width: 100,
      render: (_, record: any) => (
        <Button
          type="link"
          onClick={(e) => { e.stopPropagation(); router.push(`/enterprises/${record.id}`); }}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: '客户矩阵',
        subTitle: '企业客户管理',
        extra: [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
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
            const res = await api.get('/enterprises', { params });
            const items = res.data?.items || res.data || [];
            return {
              data: Array.isArray(items) ? items : [],
              success: true,
              total: res.data?.total || items.length,
            };
          } catch (e) {
            message.error('客户数据加载失败');
            return { data: [], success: false };
          }
        }}
        rowKey="id"
        search={{
          labelWidth: 'auto',
        }}
        onRow={(record: any) => ({
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
            onSearch: (value: string) => {
              console.log('search', value);
            },
          },
        }}
      />
    </PageContainer>
  );
}
