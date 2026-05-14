'use client';

import { Button, Descriptions, Drawer, Empty, Input, Space, Tag, Typography } from 'antd';
import { Check, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';
import type { StagingCandidate, StagingDecision } from './types';

const { Paragraph, Text } = Typography;

interface StagingCandidateDrawerProps {
  open: boolean;
  loading?: boolean;
  candidate?: StagingCandidate | null;
  onClose: () => void;
  onDecision: (decision: StagingDecision, rejectReason?: string) => Promise<void>;
  onPromote: () => Promise<void>;
}

export default function StagingCandidateDrawer({
  open,
  loading,
  candidate,
  onClose,
  onDecision,
  onPromote,
}: StagingCandidateDrawerProps) {
  const [rejectReason, setRejectReason] = useState('');

  return (
    <Drawer
      title={candidate?.name || '暂存候选人'}
      width={680}
      open={open}
      onClose={onClose}
      loading={loading}
      extra={
        <Space>
          <Button icon={<X size={14} />} danger onClick={() => onDecision('reject', rejectReason)}>
            拒绝
          </Button>
          <Button icon={<RotateCcw size={14} />} onClick={() => onDecision('review')}>
            待复核
          </Button>
          <Button icon={<Check size={14} />} type="primary" onClick={onPromote}>
            入库
          </Button>
        </Space>
      }
    >
      {!candidate ? (
        <Empty />
      ) : (
        <div className="space-y-5">
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="来源">{candidate.sourcePlatform || candidate.sourceType}</Descriptions.Item>
            <Descriptions.Item label="质量分">{candidate.qualityScore}</Descriptions.Item>
            <Descriptions.Item label="职位">{candidate.currentTitle || '-'}</Descriptions.Item>
            <Descriptions.Item label="公司">{candidate.currentCompany || '-'}</Descriptions.Item>
            <Descriptions.Item label="手机号">{candidate.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{candidate.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="Trace ID" span={2}>{candidate.traceId || '-'}</Descriptions.Item>
            <Descriptions.Item label="来源链接" span={2}>
              {candidate.sourceUrl ? (
                <a href={candidate.sourceUrl} target="_blank" rel="noreferrer">{candidate.sourceUrl}</a>
              ) : '-'}
            </Descriptions.Item>
          </Descriptions>

          <div>
            <Text className="mb-2 block text-sm font-semibold text-text-main">质量原因</Text>
            <Space wrap>
              {(candidate.qualityReasons || []).map((reason) => (
                <Tag key={reason}>{reason}</Tag>
              ))}
              {candidate.matchedCandidateId && <Tag color="purple">重复命中 {candidate.matchedCandidateId}</Tag>}
            </Space>
          </div>

          <div>
            <Text className="mb-2 block text-sm font-semibold text-text-main">拒绝原因</Text>
            <Input.TextArea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              rows={3}
              placeholder="选择拒绝时填写原因"
            />
          </div>

          <div>
            <Text className="mb-2 block text-sm font-semibold text-text-main">原始文本</Text>
            <Paragraph className="max-h-[320px] overflow-auto rounded-md border border-border-subtle bg-bg-base p-3 text-xs whitespace-pre-wrap">
              {candidate.resumeText || '暂无原始文本'}
            </Paragraph>
          </div>
        </div>
      )}
    </Drawer>
  );
}
