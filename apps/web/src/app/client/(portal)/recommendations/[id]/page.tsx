'use client';

import { Button, Descriptions, Empty, Skeleton, Space, Tag, Typography } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ClientFeedbackPanel from '@/components/client/ClientFeedbackPanel';
import type { ClientRecommendation } from '@/components/client/types';
import api from '@/lib/api';

const { Paragraph } = Typography;

export default function ClientRecommendationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<ClientRecommendation | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/recommendations/client/${id}`);
        setItem(res.data?.data || res.data);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id]);

  if (loading) return <Skeleton active paragraph={{ rows: 10 }} />;
  if (!item) return <Empty />;

  const analysis = item.aiAnalysis || {};
  return (
    <div className="space-y-4">
      <Button icon={<ArrowLeft size={14} />} onClick={() => router.push('/client/recommendations')}>
        返回列表
      </Button>

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="m-0 text-xl font-bold">{item.candidate.displayName}</h1>
            <p className="m-0 mt-1 text-sm text-slate-500">{item.job?.title || '-'}</p>
          </div>
          <Tag color="blue">{item.status}</Tag>
        </div>
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="当前职位">{item.candidate.currentTitle || '-'}</Descriptions.Item>
          <Descriptions.Item label="当前公司">{item.candidate.currentCompany || '-'}</Descriptions.Item>
          <Descriptions.Item label="年限">{item.candidate.totalYears || '-'}</Descriptions.Item>
          <Descriptions.Item label="学历">{item.candidate.degree || '-'}</Descriptions.Item>
          <Descriptions.Item label="学校">{item.candidate.school || '-'}</Descriptions.Item>
          <Descriptions.Item label="匹配度">{item.matchScore || 0}</Descriptions.Item>
        </Descriptions>
        <Space wrap className="mt-3">
          {(item.candidate.skills || []).map((skill) => <Tag key={skill}>{skill}</Tag>)}
        </Space>
      </section>

      <InfoBlock title="AI 亮点" items={analysis.highlights} />
      <InfoBlock title="潜在风险" items={analysis.risks} />
      <InfoBlock title="面试建议" items={analysis.interviewSuggestions} />
      <section className="rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-2 text-sm font-semibold">猎头备注</div>
        <Paragraph className="m-0 text-sm text-slate-600">{analysis.conclusion || item.notes || '暂无备注'}</Paragraph>
      </section>
      <ClientFeedbackPanel recommendationId={item.id} />
    </div>
  );
}

function InfoBlock({ title, items }: { title: string; items?: string[] }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <div className="mb-2 text-sm font-semibold">{title}</div>
      {items && items.length > 0 ? (
        <ul className="m-0 space-y-2 pl-5 text-sm text-slate-600">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <div className="text-sm text-slate-400">暂无内容</div>
      )}
    </section>
  );
}
