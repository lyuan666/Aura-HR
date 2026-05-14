'use client';

import { Button, Progress, Space, Tag, Typography } from 'antd';
import { ChevronRight } from 'lucide-react';
import type { ClientRecommendation } from './types';

const { Text } = Typography;

interface ClientRecommendationCardProps {
  recommendation: ClientRecommendation;
  onOpen: () => void;
}

export default function ClientRecommendationCard({ recommendation, onOpen }: ClientRecommendationCardProps) {
  const score = Number(recommendation.matchScore || 0);
  return (
    <div className="grid grid-cols-[1.4fr_1.1fr_160px_140px_80px] items-center gap-4 border-b border-slate-200 px-4 py-3 last:border-b-0">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-950">{recommendation.candidate.displayName}</div>
        <Text className="block truncate text-xs text-slate-500">
          {recommendation.candidate.currentTitle || '-'} · {recommendation.candidate.currentCompany || '-'}
        </Text>
      </div>
      <div className="min-w-0 truncate text-sm text-slate-700">{recommendation.job?.title || '-'}</div>
      <Progress percent={score} size="small" />
      <Space size={6}>
        <Tag color="blue">{recommendation.status}</Tag>
        <Text className="text-xs text-slate-500">
          {recommendation.createdAt ? new Date(recommendation.createdAt).toLocaleDateString() : '-'}
        </Text>
      </Space>
      <Button type="text" icon={<ChevronRight size={16} />} onClick={onOpen} />
    </div>
  );
}
