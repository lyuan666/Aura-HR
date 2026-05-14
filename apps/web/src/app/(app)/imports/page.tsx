'use client';

import { App, Button, Empty, Spin, Statistic } from 'antd';
import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ImportBatchTable from '@/components/imports/ImportBatchTable';
import StagingCandidateDrawer from '@/components/imports/StagingCandidateDrawer';
import StagingCandidateTable from '@/components/imports/StagingCandidateTable';
import type { ImportBatch, StagingCandidate, StagingDecision } from '@/components/imports/types';
import api from '@/lib/api';

export default function ImportsPage() {
  const { message } = App.useApp();
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [rows, setRows] = useState<StagingCandidate[]>([]);
  const [selected, setSelected] = useState<StagingCandidate | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      candidate: rows.filter((row) => row.importDecision === 'candidate').length,
      review: rows.filter((row) => row.importDecision === 'review').length,
      duplicate: rows.filter((row) => row.matchedCandidateId).length,
      reject: rows.filter((row) => row.importDecision === 'reject').length,
    };
  }, [rows]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [batchRes, stagingRes] = await Promise.all([
        api.get('/import/batches'),
        api.get('/import/staging', { params: { page: 1, pageSize: 100 } }),
      ]);
      setBatches(Array.isArray(batchRes.data) ? batchRes.data : batchRes.data?.data || []);
      setRows(Array.isArray(stagingRes.data) ? stagingRes.data : stagingRes.data?.data || []);
    } catch (error) {
      console.error(error);
      message.error('导入暂存数据加载失败');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openDetail = async (row: StagingCandidate) => {
    setDrawerOpen(true);
    setSelected(row);
    setDetailLoading(true);
    try {
      const res = await api.get(`/import/staging/${row.id}`);
      setSelected(res.data?.data || res.data);
    } catch (error) {
      console.error(error);
      message.error('暂存详情加载失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const updateDecision = async (decision: StagingDecision, rejectReason?: string) => {
    if (!selected) return;
    await api.patch(`/import/staging/${selected.id}/decision`, { decision, rejectReason });
    message.success('审核状态已更新');
    await fetchData();
    await openDetail(selected);
  };

  const promote = async () => {
    if (!selected) return;
    const res = await api.post(`/import/staging/${selected.id}/promote`);
    const status = res.data?.status || res.data?.data?.status;
    message.success(status === 'merged' ? '已合并到已有候选人' : '已创建正式候选人');
    await fetchData();
    await openDetail(selected);
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg-base px-0 py-2 text-text-main">
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <div>
          <h1 className="m-0 text-xl font-bold tracking-wide text-text-main">数据导入</h1>
          <p className="m-0 mt-1 text-sm text-text-sub">Legacy、插件与手工上传进入正式人才库前的审核区</p>
        </div>
        <Button icon={<RefreshCw size={14} />} onClick={fetchData}>
          刷新
        </Button>
      </div>

      <div className="mb-4 grid shrink-0 grid-cols-5 gap-3">
        <Statistic className="rounded-md border border-border-subtle bg-bg-surface p-3" title="总暂存" value={stats.total} />
        <Statistic className="rounded-md border border-border-subtle bg-bg-surface p-3" title="可入库" value={stats.candidate} />
        <Statistic className="rounded-md border border-border-subtle bg-bg-surface p-3" title="待复核" value={stats.review} />
        <Statistic className="rounded-md border border-border-subtle bg-bg-surface p-3" title="重复" value={stats.duplicate} />
        <Statistic className="rounded-md border border-border-subtle bg-bg-surface p-3" title="拒绝" value={stats.reject} />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[320px_minmax(0,1fr)] gap-4">
        <section className="min-h-0 overflow-auto">
          <div className="mb-2 text-sm font-semibold text-text-main">批次</div>
          <ImportBatchTable batches={batches} loading={loading} />
        </section>
        <section className="min-h-0 overflow-auto">
          <div className="mb-2 text-sm font-semibold text-text-main">暂存候选人</div>
          {loading ? (
            <div className="flex h-80 items-center justify-center rounded-md border border-border-subtle bg-bg-surface">
              <Spin />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex h-80 items-center justify-center rounded-md border border-border-subtle bg-bg-surface">
              <Empty />
            </div>
          ) : (
            <StagingCandidateTable rows={rows} loading={loading} onOpen={openDetail} />
          )}
        </section>
      </div>

      <StagingCandidateDrawer
        open={drawerOpen}
        loading={detailLoading}
        candidate={selected}
        onClose={() => setDrawerOpen(false)}
        onDecision={updateDecision}
        onPromote={promote}
      />
    </div>
  );
}
