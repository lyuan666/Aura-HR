'use client';

import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ImportBatch } from './types';

interface ImportBatchTableProps {
  batches: ImportBatch[];
  loading?: boolean;
}

export default function ImportBatchTable({ batches, loading }: ImportBatchTableProps) {
  const columns: ColumnsType<ImportBatch> = [
    {
      title: '来源',
      dataIndex: 'sourceName',
      render: (value, row) => value || row.sourceType,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 88,
      render: (value) => <Tag color={value === 'failed' ? 'red' : 'blue'}>{value}</Tag>,
    },
    {
      title: '总数',
      dataIndex: 'totalCount',
      width: 72,
      render: (value) => value ?? 0,
    },
  ];

  return (
    <Table
      rowKey="id"
      size="small"
      loading={loading}
      columns={columns}
      dataSource={batches}
      pagination={false}
      className="overflow-hidden rounded-md border border-border-subtle bg-bg-surface"
    />
  );
}
