'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Button, Tag, Progress, App, Space } from 'antd';
import {
  PlusOutlined,
  RobotOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import SmartJobCreationModal from '@/components/jobs/SmartJobCreationModal';

export default function JobsPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const actionRef = useRef<ActionType>(null);

  const columns: ProColumns[] = [
    {
      title: '职位名称',
      dataIndex: 'title',
      key: 'title',
      render: (_, record: any) => (
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{record.title || '未命名职位'}</div>
          <Space size={4}>
            <Tag color="blue" style={{ marginRight: 0 }}>{record.enterprise?.name || '未知企业'}</Tag>
          </Space>
        </div>
      ),
    },
    {
      title: '薪资范围',
      key: 'salary',
      dataIndex: 'salaryMin',
      hideInSearch: true,
      render: (_, record: any) => (
        <div>
          <div style={{ color: '#fa8c16', fontWeight: 600 }}>
            {record.salaryMin}K - {record.salaryMax}K
          </div>
          <Space size={4} style={{ marginTop: 4 }}>
            <EnvironmentOutlined style={{ fontSize: 12, color: '#999' }} />
            <span style={{ fontSize: 12, color: '#999' }}>{record.location || '北京'}</span>
          </Space>
        </div>
      ),
    },
    {
      title: '技能要求',
      key: 'skills',
      hideInSearch: true,
      render: (_, record: any) => (
        <Space wrap size={[4, 4]}>
          {(record.skillTags || ['Java', 'Spring', 'Redis']).slice(0, 3).map((tag: string) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '招聘进度',
      key: 'progress',
      hideInSearch: true,
      render: (_, record: any) => (
        <div style={{ width: 120 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
            <span style={{ color: '#999' }}>Pipeline</span>
            <span>{record.candidateCount || 0}/10</span>
          </div>
          <Progress
            percent={Math.min((record.candidateCount || 0) * 10, 100)}
            size="small"
            showInfo={false}
          />
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      hideInSearch: true,
      render: (_, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<RobotOutlined />}
            onClick={(e) => { e.stopPropagation(); router.push(`/jobs/${record.id}/matches`); }}
          >
            AI 匹配
          </Button>
          <Button
            size="small"
            type="primary"
            onClick={(e) => { e.stopPropagation(); router.push(`/jobs/${record.id}`); }}
          >
            查看
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: '职位图谱',
        subTitle: '管理和追踪所有招聘需求',
        extra: [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            创建新职位
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
            const res = await api.get('/job-positions', { params });
            const items = res.data?.items || res.data || [];
            return {
              data: Array.isArray(items) ? items : [],
              success: true,
              total: res.data?.total || items.length,
            };
          } catch (e) {
            message.error('职位数据加载失败');
            return { data: [], success: false };
          }
        }}
        rowKey="id"
        search={{
          labelWidth: 'auto',
        }}
        onRow={(record: any) => ({
          onClick: () => router.push(`/jobs/${record.id}`),
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

      <SmartJobCreationModal
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onSuccess={() => {
          setIsModalVisible(false);
          actionRef.current?.reload();
        }}
      />
    </PageContainer>
  );
}
