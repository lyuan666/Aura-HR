'use client';

import { Button, Progress, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Eye } from 'lucide-react';
import type { StagingCandidate, StagingDecision } from './types';

const decisionMeta: Record<StagingDecision, { label: string; color: string }> = {
  candidate: { label: '可入库', color: 'green' },
  review: { label: '待复核', color: 'gold' },
  reject: { label: '拒绝', color: 'red' },
};

interface StagingCandidateTableProps {
  rows: StagingCandidate[];
  loading?: boolean;
  onOpen: (row: StagingCandidate) => void;
}

export default function StagingCandidateTable({ rows, loading, onOpen }: StagingCandidateTableProps) {
  const columns: ColumnsType<StagingCandidate> = [
    {
      title: '候选人',
      dataIndex: 'name',
      width: 180,
      render: (value, row) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-text-main">{value || '未命名'}</div>
          <div className="truncate text-xs text-text-sub">{row.currentTitle || row.currentCompany || '-'}</div>
        </div>
      ),
    },
    {
      title: '来源',
      dataIndex: 'sourcePlatform',
      width: 150,
      render: (value, row) => value || row.sourceType,
    },
    {
      title: '质量',
      dataIndex: 'qualityScore',
      width: 140,
      render: (value) => <Progress percent={value || 0} size="small" showInfo />,
    },
    {
      title: '状态',
      dataIndex: 'importDecision',
      width: 120,
      render: (value: StagingDecision, row) => (
        <Space size={4}>
          <Tag color={decisionMeta[value]?.color || 'default'}>{decisionMeta[value]?.label || value}</Tag>
          {row.matchedCandidateId && <Tag color="purple">重复</Tag>}
        </Space>
      ),
    },
    {
      title: '联系方式',
      width: 180,
      render: (_, row) => (
        <div className="text-xs text-text-sub">
          <div>{row.phone || '-'}</div>
          <div>{row.email || '-'}</div>
        </div>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 170,
      render: (value) => (value ? new Date(value).toLocaleString() : '-'),
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_, row) => (
        <Button size="small" icon={<Eye size={14} />} onClick={() => onOpen(row)} />
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      size="middle"
      loading={loading}
      columns={columns}
      dataSource={rows}
      onRow={(row) => ({ onClick: () => onOpen(row) })}
      pagination={{ pageSize: 12, showSizeChanger: false }}
      className="overflow-hidden rounded-md border border-border-subtle bg-bg-surface"
    />
  );
}
