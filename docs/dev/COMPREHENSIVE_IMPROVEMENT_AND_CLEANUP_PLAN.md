# Review 与测试结果综合改进方案及冗余代码清理计划

> 日期：2026-04-29  
> 范围：基于当前 code review、接口对比、运行态测试、lint/test/audit 结果形成的阶段性整改方案。  
> 原则：先修真实阻断问题，再清理重复和废弃路径，最后建立契约与 CI 门禁。

---

## 1. 总体策略

当前系统的问题不是单点 bug，而是三类问题叠加：

1. 核心链路存在可见失败：上传后解析失败、推荐创建失败、设置页接口不存在。
2. 安全与数据边界存在高风险：JWT 丢失 `tenantId`，业务查询在缺少租户时退化为全局查询。
3. 代码库存在架构沉积：新旧上传链路、两套 LLM client、两套队列体系、未接入的实验 UI 和后端模块并存。

整改目标：

- 修复用户可见的 `401/404/500` 和核心业务断点。
- 让上传、匹配、推荐、交付、设置这些主链路可验收。
- 清理或隔离未接入、重复、废弃代码，降低维护面。
- 建立前后端接口契约，避免 UI 先行但后端缺失的问题反复出现。

---

## 1.5 开发协作与架构原则 (AI Multi-Agent Workflow)

根据最新的研发规范，本计划的执行优先采用 **Superpowers+AI 协作模式**，但不把具体模型分工作为硬性阻塞条件；最终以代码 owner、测试结果和 review 结论为准。

- **首选角色分工**：
  - **Claude (架构师/PM)**：负责需求分析、架构设计、任务拆分、代码审核 (Code Review) 与合并验收。
  - **Codex (后端优先)**：负责 NestJS 接口、数据库迁移、单元测试，也可在接口契约任务中协助前端联调。
  - **Gemini (前端优先)**：负责 Next.js/Ant Design 组件、页面样式、安全审计，也可在必要时协助简单后端验证。
- **降级预案**：遇单模型不可用时，其他执行者可接管任务；提交说明中需要注明接管范围、验证结果和遗留风险。
- **架构决策（Linus 三问）**：在进行下述所有代码清理与重构前，必须灵魂三问：
  1. _这是现实问题还是想象问题？_（拒绝过度设计）
  2. _有没有更简单的做法？_（寻找最简方案）
  3. _会破坏什么？_（向后兼容是铁律）

## 2. Phase 0：安全与核心阻断修复

优先级最高，建议作为第一批改动。

| 问题                   | 处理方案                                                                 | 预期效果                |
| ---------------------- | ------------------------------------------------------------------------ | ----------------------- |
| JWT 丢失 `tenantId`    | `JwtStrategy.validate` 返回 `tenantId`；业务查询缺 tenant 时 fail closed | 修复跨租户数据泄漏      |
| 注册 `phone` 校验错误  | `phone` 加 `@IsOptional()`                                               | 正常注册不再 `400`      |
| 分页无边界             | 统一 `PageQueryDto`，限制 `page >= 1`、`pageSize <= 100`                 | 防止 `500` 和大查询滥用 |
| 候选人枚举输入变 `500` | `gender/status` 使用 `IsEnum`                                            | 输入错误返回 `400`      |
| 推荐创建变 `500`       | 补 `CreateRecommendationDto`、写入 `consultantId`、校验 candidate/job    | 推荐核心链路可用        |
| AI 空请求消耗模型      | DTO 校验最小长度、超时、`maxTokens`                                      | 降低模型浪费和慢请求    |

验收标准：

- 恶意输入返回 `4xx`，不再落到 `500`。
- 租户隔离有 e2e 覆盖：A 租户不能读到 B 租户数据。
- API 全量单测恢复通过。
- `pnpm --filter @yzschros/api build` 通过。

---

## 3. Phase 1：上传简历链路专项优化

上传是当前用户体感最强的问题，需要独立处理。

| 问题                                              | 处理方案                                                            | 预期效果               |
| ------------------------------------------------- | ------------------------------------------------------------------- | ---------------------- |
| 上传入队快但 worker 报 `Invalid URL`              | 统一 `LlmClientService` / `LlmRouterService`，补启动期 LLM 配置校验 | 上传后能真实解析完成   |
| 旧 `/candidates/upload` 与新 `/batch-upload` 并存 | 新链路稳定后废弃旧同步上传接口；保留兼容期和迁移说明                | 减少解析逻辑分叉       |
| 批量上传缺逐文件隔离                              | 每个文件独立 try/catch，返回 `queued/rejected/failed`               | 单个文件失败不拖垮整批 |
| SSE 只校验 token                                  | batchId 绑定 user/tenant，订阅前校验归属                            | 防止进度泄露           |
| 前端只追踪一个批次                                | 用 `Map<batchId, EventSource>` 或禁用并发批次                       | 多批上传状态不丢       |
| 请求线程仍写 MinIO                                | 中期改预签名直传，后端只入队元数据                                  | 大文件和高并发更稳     |

验收标准：

- 20 个普通简历文件上传入队耗时小于 1 秒。
- 单个文件失败时，其他文件仍可继续入队和解析。
- SSE 不串批次，不泄露其他用户上传进度。
- worker 成功率、失败原因、耗时可观测。

---

## 4. Phase 2：前后端接口契约补齐

以 `docs/dev/FRONTEND_BACKEND_API_GAP_DEVELOPMENT_PLAN.md` 为详细开发文档，本阶段只列总体方向。

| 前端能力           | 后端补齐                                           |
| ------------------ | -------------------------------------------------- |
| 设置页个人资料保存 | `PATCH /auth/profile`                              |
| 设置页安全/AI 开关 | `GET/PATCH /settings/config`                       |
| 合同模板下载       | 前端接 `GET /contracts/templates`，后端补 download |
| 合同查看           | 前端接 `GET /contracts/:id`                        |
| 推荐流程推进       | 补推荐状态 DTO、约面 DTO、状态机校验               |
| 交付看板操作       | 接推荐状态、约面、话术、报告                       |
| 分析页指标         | 统一 analytics 响应结构                            |

处理策略：

- 短期能实现的补接口。
- 短期不做的 UI 加 `disabled`、feature flag 或隐藏。
- 所有新增接口必须有 DTO 校验、租户过滤和测试。

---

## 5. Phase 3：冗余代码清理计划

### 5.1 可直接删除或归档

| 代码                                                                                         | 原因                                                                              | 动作                                                                             |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `apps/api/src/app.controller.ts` / `app.service.ts`                                          | Nest starter 残留，未挂入 `AppModule`                                             | 删除或连同测试归档                                                               |
| `apps/web/src/legacy/MainLayout.tsx`                                                         | 未被生产路由引用；当前生产布局为 `AppProLayout`                                   | 彻底删除                                                                         |
| `apps/web/src/components/dashboard/DashboardContainer.tsx`                                   | 当前 dashboard page 已自实现                                                      | 确认无入口后删除                                                                 |
| `apps/web/src/components/candidates/HolographicCard.tsx`                                     | 过于炫技且未接入的实验组件                                                        | 删除或移入 `experiments/`                                                        |
| `apps/web/src/components/candidates/ProcessControlPanel.tsx`                                 | mock 数据且未接入                                                                 | 若近期做交付流程则保留并接 API，否则移入 `experiments/`                          |
| `apps/web/src/components/delivery/JobSidebar.tsx`                                            | 未引用                                                                            | 删除                                                                             |
| `apps/web/src/components/v2/` 目录下的核心组件 (V2Layout, V2Sidebar, V2Header, RichIcons 等) | **状态变更**：已作为 B2B SaaS 专业化布局候选，但当前生产路由仍使用 `AppProLayout` | 暂不删除。下一步动作：先完成生产路由迁移和视觉回归验证，再重命名去除 `v2` 标识。 |

### 5.2 需要合并的重复实现

| 重复点                                                         | 合并方案                                                                      |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `LlmClientService` vs `LlmRouterService`                       | 保留一个统一 LLM gateway，支持 provider、fallback、限流、JSON 解析            |
| `parsing.service` vs `parsing-v2.service`                      | 保留 V2 管线，旧解析作为兼容 adapter，最终删除                                |
| BullMQ vs PendingJob/EventEmitter                              | 选择 BullMQ，删除 `QueueService` / `PendingJob` / `MatchingListener` 沉积路径 |
| `/reports/recommendation/:id` vs `/recommendations/:id/report` | 明确一个返回 PDF，一个返回 JSON；命名和前端入口统一                           |
| `/candidates/upload` vs `/candidates/batch-upload`             | 保留批量异步上传；旧同步接口进入 deprecated 状态                              |

### 5.3 暂不删除但标记 internal/experimental

| 模块                   | 原因                                   | 建议                                |
| ---------------------- | -------------------------------------- | ----------------------------------- |
| `InvoiceModule`        | 后端完整但前端无入口，未来财务闭环需要 | 标记 internal，等 UI 补齐           |
| `GuaranteeModule`      | 后端有能力但 UI 未接                   | 标记 internal，补保活期页面后开放   |
| `ReportModule`         | PDF 报告未来有价值                     | 明确与 recommendation report 的边界 |
| `ShareModule.generate` | HR 分享闭环需要，但前端入口缺失        | 补入口前保持 internal               |

---

## 6. Phase 4：代码质量和测试体系

| 项目           | 当前问题                 | 改进方案                                                                      |
| -------------- | ------------------------ | ----------------------------------------------------------------------------- |
| API 单测       | `AiService` spec 缺 mock | 修复后全量 jest 必须通过                                                      |
| API lint       | 1000+ 问题               | 先对改动文件强制，再分模块消债                                                |
| Web lint       | 200 问题                 | 先修阻断错误，警告分模块处理                                                  |
| Extension lint | 缺 ESLint 9 配置         | 补 `eslint.config.mjs`                                                        |
| 依赖审计       | 12 个中高危              | 升级 `serialize-javascript`、`path-to-regexp`、`@xmldom/xmldom`、`postcss` 等 |
| 契约测试       | 缺失                     | 生成 OpenAPI，前端调用必须匹配后端 schema                                     |

建议新增 CI 检查：

```bash
pnpm --filter @yzschros/api build
pnpm --filter @yzschros/web build
pnpm --filter @yzschros/extension build
pnpm --filter @yzschros/api test
pnpm audit --audit-level moderate
```

在 lint 债务清完前，建议增加“只检查改动文件”的门禁，避免大规模历史问题阻塞所有功能修复。

---

## 7. 推荐执行顺序

1. 修租户隔离、DTO 校验、分页、推荐创建。
2. 修 LLM 配置和上传 worker，让上传链路真正闭环。
3. 补设置页接口，隐藏暂不开发的安全/AI 开关。
4. 合并上传旧接口和解析旧实现。
5. 清理未引用前端组件和 Nest starter 残留。
6. 决定 BullMQ 为唯一任务体系，移除 PendingJob/EventEmitter 沉积代码。
7. 给 Invoice/Guarantee/Report/Share 做 internal 标记或补前端入口。
8. 建 OpenAPI + typed client + CI 契约检查。

---

## 8. 最终验收口径

整改完成后至少达到：

- `pnpm --filter @yzschros/api build` 通过。
- `pnpm --filter @yzschros/web build` 通过。
- `pnpm --filter @yzschros/extension build` 通过。
- API 全量 jest 通过。
- 关键 e2e 覆盖注册、登录、上传、候选人列表、匹配推荐、设置保存。
- 前端不存在调用后端未暴露接口。
- 生产路径不再引用 mock、legacy、experimental 组件。
- 冗余接口有明确状态：`active`、`internal`、`deprecated`、`removed`。
- 高危依赖漏洞已处理或有明确风险接受记录。

---

## 9. 风险与注意事项

- 清理代码前先确认是否有产品 owner 和近期排期，避免误删未来明确要做的能力。
- 删除后端模块前必须确认数据库表、迁移、实体引用和测试是否同步处理。
- 对上传链路做改动时，应避免再次把 AI 解析放回请求线程。
- 对租户隔离做 fail closed 后，可能暴露历史数据缺少 `tenantId` 的问题，需要配套数据修复脚本。
- OpenAPI/typed client 建立前，新增接口应至少同步更新开发文档。
- **AI 服务降级风险**：在委托 Codex 或 Gemini 进行大规模重构时，若遭遇 API 熔断，必须遵守降级接管流程，严禁主控模型（Claude）强行手写大量代码导致上下文溢出。
