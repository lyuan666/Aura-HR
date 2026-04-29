# YZSCHROS 全面质量评估与重构计划

日期: 2026-04-29
范围: Web、API、Extension、基础设施、核心业务链路
环境: 本地 3003 Web、3001 API、PostgreSQL/Redis/MinIO Docker 服务

## 1. 执行摘要

当前系统可以构建并通过后端单元测试，但尚未达到稳定上线标准。主要风险集中在四类:

- 功能完整性: 简历上传依赖 LLM 配置，配置缺失时会失败；设置页存在缺失 API；若干按钮仍是占位或无反馈。
- 用户体验: 多处页面混用暗色全局主题与 Ant Design 亮色组件，局部对比度不足；候选人列表存在样例数据回退，容易误导用户。
- 代码质量: Web lint 93 errors / 110 warnings；API lint 987 errors / 109 warnings，类型安全、格式化和未使用代码债务较重。
- 部署稳定性: 生产部署缺少明确健康检查、环境变量校验、队列失败可观测性和轻量化部署边界。

已完成一个窄范围修复:

- `candidates/upload-progress/:key` 标记为公开路由，由方法内部校验 query token，解决 EventSource 不能携带 Authorization header 导致的 401。
- 上传同一文件遇到历史 failed job 时允许移除并重试，避免前端永久停在 `QUEUED`。
- parse-resume worker 推送失败原因，LLM 配置缺失时前端展示明确错误。
- LLM 调用前增加配置校验，避免只暴露 `Invalid URL`。

## 2. 验证结果

自动化命令:

- `pnpm --filter @yzschros/api build`: 通过
- `pnpm --filter @yzschros/web build`: 通过
- `pnpm --filter @yzschros/extension build`: 通过
- `pnpm --filter @yzschros/api exec jest --runInBand`: 16 suites / 36 tests 通过
- `pnpm --filter @yzschros/web lint`: 失败，93 errors / 110 warnings
- `pnpm --filter @yzschros/api exec eslint "{src,apps,libs,test}/**/*.ts"`: 失败，987 errors / 109 warnings

浏览器 QA 覆盖页面:

- `/dashboard`
- `/candidates`
- `/jobs`
- `/enterprises`
- `/contracts`
- `/delivery`
- `/settings`
- `/analysis`
- `/share/test-token`

截图目录:

- `docs/dev/qa-2026-04-29/`

## 3. 主要缺陷

### P0: 简历上传链路依赖未校验的 LLM 配置

现象: 上传能入队，但解析任务在 50% 失败。修复后前端显示 `LLM provider is not configured: missing url or model`。

根因: `LLM_RESUME_URL` / `LLM_RESUME_MODEL` 等配置缺失，worker 调用 axios 时原本抛出低可读性的 `Invalid URL`。

后续要求:

- 启动时做环境变量校验。
- 部署文档必须列出 LLM provider 配置矩阵。
- 简历上传验收必须包含成功解析、失败重试、重复上传、SSE 断线恢复。

### P0: 设置页调用不存在的 API

现象: `/settings` 触发两次 `GET /api/settings/config` 404。

根因: Web 已接入设置配置读写，但 API 未提供 `/settings/config`；同时页面调用 `PUT /auth/profile`，后端也没有对应方法。

后续要求:

- 要么实现 SettingsModule 与 profile update API，要么前端移除不可用开关。
- 所有页面网络请求必须有契约测试，禁止静默吞掉 404。

### P1: 简历库存在占位和误导性数据

现象: 候选人列表在字段缺失时回退到固定公司、岗位、学校、经历，例如 `阿里云`、`前端开发专家`、`浙江大学`。

影响: 用户无法区分真实数据与演示数据，会被误导为“数据加载异常”或“解析结果串库”。

后续要求:

- 缺失字段显示空状态或 `未填写`。
- 演示数据只能出现在 seed/demo 模式，不允许混入生产 UI fallback。

### P1: 交付/流程列表存在数据语义错配

现象: 交付看板只按推荐状态分列；候选人详情和流程面板使用硬编码流程节点，未绑定真实 recommendation/follow-up 状态机。

影响: 用户看到的“流程”不一定等于数据库真实状态。

后续要求:

- 统一候选人、推荐、面试、offer、入职状态机。
- UI 流程节点从 API 返回的状态派生，禁止硬编码业务阶段。

### P1: UI 主题混乱和可读性不足

现象: 全局 CSS 为暗色主题，但当前主布局使用 Ant Design Pro 亮色 `navTheme="light"` 和大量默认 Card/Table/Input 样式；设置页、分析页、候选人页视觉语言不一致。

影响: 局部文字对比度不足，用户反馈“白色看不清文字”与该混搭高度相关。

后续要求:

- 决定统一主题: 现已确立专业、高级的金融级暗黑 B2B SaaS 主题（Deep Charcoal + Steel Blue），不再退回亮色。后续任务是将此 V2 视觉语言全站铺开。
- 建立组件 token: 背景、文字、边框、状态色、表格、表单、弹窗统一管理。
- 每个页面做 WCAG AA 对比度检查。

### P2: Web/API 代码质量门禁失效

现象:

- Web: 大量 `any`、未使用 import、hook dependency、React static component 规则错误。
- API: 大量 prettier、unsafe any、unsafe member access、require import、promise rejection 类型错误。

影响: 代码审查成本高，重构风险高，CI 即使加入 lint 也会立即失败。

后续要求:

- 先格式化和清理低风险问题，再逐模块收紧类型。
- 建立 `lint:ci`，避免脚本默认 `--fix` 修改代码。

### P2: 部署形态偏重

现状: 运行依赖 PostgreSQL + pgvector、Redis、MinIO、MinerU、API、Web、LLM provider。

风险:

- 单机小云服务器资源压力较大。
- MinIO/MinerU/LLM 不是所有部署都必须内置。
- 缺少 compose profiles 区分 lite/full/worker。

后续要求:

- 拆分 `api`、`worker`、`web`、`infra`。
- 轻量部署默认启用 PostgreSQL + Redis + API + Web；对象存储和 MinerU 作为可选 profile。
- 简历与合同等大文件上传应迁移到对象存储预签名直传模式，API 仅负责签发上传凭证、校验回调和记录元数据。
- 上传解析 worker 可独立水平扩展。

## 4. 重构路线图

### Phase 0: 稳定化与门禁

目标: 所有核心页面无 404/401/500，上传失败可解释，CI 可重复运行。

任务:

- 实现 `/settings/config` 和 `PUT /auth/profile`，或删除对应 UI。
- 完成 LLM 环境变量校验和启动失败提示。
- 为 upload-progress、batch-upload、settings、share 增加 e2e 覆盖。
- 建立 `build:web`、`build:api`、`test:api`、`lint:ci` 质量门禁。

验收:

- 核心页面 console error = 0。
- 关键 API 404/500 = 0。
- 简历上传成功或失败都有明确终态。

### Phase 1: 业务状态统一

目标: 修复流程列表错误和硬编码流程节点。

任务:

- 定义 Candidate、Recommendation、FollowUp、Interview、Offer 状态模型。
- **必须配套提供 TypeORM 数据迁移脚本 (Migrations)**，确保历史数据的平滑过渡，严禁直接修改表结构导致数据丢失。
- 后端提供流程聚合 API。
- 前端交付看板和候选人详情只消费真实流程数据。
- 移除页面内硬编码流程和演示 fallback。

验收:

- 同一推荐记录在列表、详情、看板、分析页状态一致。
- 状态迁移非法时 API 返回 400，并有测试覆盖。

### Phase 2: UI 系统重整

目标: 消除界面混乱，将已确立的金融级暗黑 SaaS 视觉语言全站铺开。

任务:

- 明确采用 Deep Charcoal + Steel Blue 的高级暗黑主题，冻结全局 token，禁止回退到亮色 Pro 默认风格。
- 将设置、分析、合同、客户等剩余页面迁移到统一 V2 布局系统，淘汰 legacy/V2/Pro 混用。
- 对表格、筛选、批量操作、空状态、错误状态建立统一组件。
- 所有占位按钮改为可用、禁用带说明或移除。

验收:

- 页面视觉一致性人工评审通过。
- 文字对比度达到 WCAG AA。
- 移动/窄屏无重叠、无横向溢出，除看板类特定区域。

### Phase 3: 性能和资源优化

目标: 提升运行效率并适配云端稳定部署。

任务:

- API 查询加分页、字段选择、关系加载策略审计。
- BullMQ worker 与 API 进程拆分。
- **简历/文件上传全面引入对象存储预签名直传 (Presigned URL)**，将文件 I/O 从 API 主节点彻底剥离，提升高并发能力。
- API 上传接口保留为兼容 fallback，但默认路径不再接收大文件二进制流。
- PDF/MinerU/LLM 调用限流、超时、重试和降级。
- Web bundle 分析，移除未使用大组件和 legacy 入口。
- Docker compose profiles: `lite`、`full`、`worker`。

验收:

- 首屏页面 P95 小于 2.5s。
- API P95 小于 500ms，上传解析除外。
- 单机 2C4G lite 环境可稳定运行。
- 并发上传时 API 进程 CPU/内存不随文件体积线性增长。
- worker 失败不拖垮 API。

### Phase 4: 可维护性治理

目标: 让团队能长期迭代。

任务:

- 建立 shared API types 或 OpenAPI contract。
- Web 移除页面级 `any`，API 移除 unsafe any 热点。
- 建立测试金字塔: service unit、controller contract、browser smoke。
- 推行 **Superpowers+AI 多智能体协作机制** (Claude 把控架构与 CR，Codex 实现后端，Gemini 实现前端)，建立防降级与防幻觉的开发护栏。
- 多智能体输出必须落到同一份任务分解、接口契约和验收清单中；任何 AI 生成变更都必须经过人工或交叉模型 review 后进入主线。
- 文档化部署、回滚、备份、监控。

验收:

- Web/API lint error = 0。
- 核心业务模块测试覆盖率大于 70%。
- PR 模板包含 QA 证据和部署影响说明。

## 5. 质量评估标准

功能完整性:

- 登录、注册、刷新 token、核心列表、详情、上传、交付状态、分享页均有自动化覆盖。
- 用户可见按钮必须满足: 可执行、禁用并解释、或不可见。

性能:

- Web 生产构建成功。
- 核心页面 P95 小于 2.5s。
- 列表接口默认分页，禁止无界查询。

稳定性:

- 生产环境 `synchronize=false`。
- 启动时校验数据库、Redis、对象存储、LLM 必需配置。
- 队列任务必须有失败原因、重试策略、死信巡检。

可维护性:

- CI 中 lint/typecheck/test/build 全部通过。
- 不允许生产 UI fallback 到演示业务数据。
- 状态机和 API contract 有测试。

部署:

- 提供 `.env.example`。
- 提供 lite/full compose profile。
- 支持健康检查、日志留存、数据库备份和回滚说明。

## 6. 建议优先级

1. 先完成 Phase 0，消除 404、上传黑箱和环境变量黑洞。
2. 再做 Phase 1，统一流程状态，解决“流程列表错误”的业务根因。
3. 接着做 Phase 2，统一 UI 主题和交互，处理“界面混乱”。
4. 最后做部署轻量化和长期治理，避免重构过程中反复返工。
