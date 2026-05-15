-- Migration 006: 候选人历史简历归档
-- 用途：duplicate-decision=replace 时把旧 resumeUrl 推入此字段，保留追溯能力
-- 不影响现有数据；jsonb 默认 null

ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS history_resume_urls jsonb;

COMMENT ON COLUMN candidates.history_resume_urls IS
  '历史简历 URL 数组，duplicate-decision=replace 时旧 resumeUrl 归档到这里';
