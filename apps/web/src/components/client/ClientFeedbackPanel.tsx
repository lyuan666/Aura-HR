'use client';

import { App, Button, Input, Space } from 'antd';
import { useState } from 'react';
import api from '@/lib/api';

interface ClientFeedbackPanelProps {
  recommendationId: string;
}

const quickFeedback = ['发起面试', '不合适', '需要更多信息'];

export default function ClientFeedbackPanel({ recommendationId }: ClientFeedbackPanelProps) {
  const { message } = App.useApp();
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (value = feedback) => {
    if (!value.trim()) {
      message.warning('请先填写反馈');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/recommendations/client/${recommendationId}/feedback`, { feedback: value });
      setFeedback(value);
      message.success('反馈已提交');
    } catch (error) {
      console.error(error);
      message.error('反馈提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="mb-3 text-sm font-semibold text-slate-950">反馈区</div>
      <Space wrap className="mb-3">
        {quickFeedback.map((item) => (
          <Button key={item} onClick={() => submit(item)} loading={submitting}>
            {item}
          </Button>
        ))}
      </Space>
      <Input.TextArea
        rows={4}
        value={feedback}
        onChange={(event) => setFeedback(event.target.value)}
        placeholder="补充说明面试时间、疑问或拒绝原因"
      />
      <Button type="primary" className="mt-3" loading={submitting} onClick={() => submit()}>
        提交反馈
      </Button>
    </div>
  );
}
