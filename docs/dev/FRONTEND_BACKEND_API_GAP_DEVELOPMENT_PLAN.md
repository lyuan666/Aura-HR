# 前端已设计能力与后端接口补齐开发文档

> 日期：2026-04-29  
> 目的：把 code review 中发现的“前端已有页面/交互设计，但后端尚未完整实现”的内容从缺陷清单中拆出来，作为后续后端开发、接口契约和验收测试的独立排期依据。

---

## 1. 文档边界

本文只记录三类内容：

1. 前端已经调用接口，但后端没有对应实现或方法不一致。
2. 前端已经做出交互入口、表单或按钮，但当前还没有后端数据模型/API 支撑。
3. 后端已有部分接口，但前端仍在用本地常量、mock 数据或未接入真实 API。

本文不重复记录安全缺陷、性能缺陷、租户隔离等必须立即修复的问题；这些仍归入 code review 的阻断问题清单。

---

## 2. 当前接口契约差距总览

| 优先级 | 前端位置                                                     | 当前前端能力           | 后端现状                                                               | 建议处理                                      |
| ------ | ------------------------------------------------------------ | ---------------------- | ---------------------------------------------------------------------- | --------------------------------------------- |
| P0     | `apps/web/src/app/(app)/settings/page.tsx`                   | 个人资料编辑并保存     | 只有 `GET /auth/profile`，缺少更新接口                                 | 补 `PATCH /auth/profile`                      |
| P0     | `apps/web/src/app/(app)/settings/page.tsx`                   | 安全/AI 配置开关       | 缺少 `SettingsModule`                                                  | 补 `GET/PATCH /settings/config`               |
| P1     | `apps/web/src/components/candidates/ProcessControlPanel.tsx` | 候选人交付流程控制台   | 组件未接入；后端推荐状态接口不完整承载流程动作                         | 建交付流程 API 或合并到 recommendation 状态机 |
| P1     | `apps/web/src/app/(app)/contracts/page.tsx`                  | 合同模板抽屉和下载按钮 | 后端有 `GET /contracts/templates`，但前端仍用本地常量且按钮不调用接口  | 前端接入 + 后端返回可下载 URL/文件流          |
| P1     | `apps/web/src/app/(app)/jobs/[id]/matches/page.tsx`          | 推荐、生成匹配报告     | 后端接口存在，但创建推荐缺 DTO/consultantId，报告依赖推荐创建成功      | 补 DTO、consultantId、错误语义和测试          |
| P2     | `apps/web/src/app/(app)/delivery/page.tsx`                   | 交付看板状态展示       | 后端有 recommendation 列表和状态接口，但前端没有状态变更/约面/报告入口 | 补 UI 或暂缓对应后端端点                      |
| P2     | `apps/web/src/app/(app)/analysis/page.tsx`                   | 数据分析页             | 后端缺少部分细分指标契约；已有 `talent-stats` 前端未接                 | 定义 analytics 指标契约                       |
| P2     | `apps/web/src/app/(app)/contracts/page.tsx`                  | 合同查看、状态变更     | 后端有详情/状态接口，前端“查看”按钮未接入                              | 补详情抽屉和状态动作                          |

---

## 3. P0：用户设置与个人档案

### 3.1 `PATCH /auth/profile`

前端来源：

- `apps/web/src/app/(app)/settings/page.tsx`
- 当前调用：`PUT /auth/profile`

建议后端接口：

```http
PATCH /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json
```

请求体：

```json
{
  "name": "张三",
  "phone": "13800138000",
  "avatar": "https://..."
}
```

约束：

- 不允许普通用户直接修改 `role`、`tenantId`、`isActive`。
- `email` 是否允许修改需要产品确认；若允许，必须做唯一性校验和二次验证。
- 返回值应与 `GET /auth/profile` 保持同构。

验收标准：

- 合法修改返回 `200`，刷新后 `GET /auth/profile` 能看到新值。
- 修改他人字段或越权字段被忽略或返回 `400/403`。
- DTO 覆盖 `name`、`phone`、`avatar` 的长度和格式校验。

### 3.2 `GET/PATCH /settings/config`

前端来源：

- 安全设置：`mfa`、`auditLog`、`apiKey`
- AI 配置：`glm4`、`deepParse`、`autoInvite`
- 当前调用：`GET /settings/config`、`PUT /settings/config`

建议后端接口：

```http
GET /api/settings/config
PATCH /api/settings/config
```

建议数据模型：

```ts
interface UserSettingsConfig {
  security: {
    mfaEnabled: boolean;
    auditLogEnabled: boolean;
    apiKeyEnabled: boolean;
  };
  ai: {
    glm4EnhancedParsing: boolean;
    deepVectorMatching: boolean;
    autoInviteMessage: boolean;
  };
}
```

落地建议：

- 短期：存入 `users.dashboardLayoutConfig` 之外的新 JSONB 字段，避免与布局配置混在一起。
- 中期：新增 `user_settings` 表，支持租户级默认值和用户级覆盖。
- `apiKeyEnabled` 不应只是布尔值，后续需要独立 `api_keys` 表、token hash、过期时间和审计日志。

验收标准：

- `GET` 返回完整默认配置，不因空记录返回 `{}`。
- `PATCH` 支持局部更新，并拒绝未知 key。
- 前端刷新后开关状态保持一致。

---

## 4. P1：交付流程控制与推荐链路

### 4.1 交付流程动作 API

前端来源：

- `apps/web/src/components/candidates/ProcessControlPanel.tsx`
- 当前状态：组件使用 `mockJobs`，按钮没有调用后端。

建议后端接口选型：

方案 A：基于推荐记录承载流程。

```http
PATCH /api/recommendations/:id/status
PATCH /api/recommendations/:id/schedule
POST  /api/recommendations/:id/interview-report
GET   /api/recommendations/:id/outreach
```

方案 B：新增交付流程聚合接口。

```http
GET  /api/delivery/candidates/:candidateId/processes
POST /api/delivery/processes
POST /api/delivery/processes/:id/actions
```

建议采用方案 A 先落地，原因是后端已有 recommendation 状态机雏形，开发成本低。

需要补齐：

- `CreateRecommendationDto`：`candidateId`、`jobId` 必填且 UUID 校验。
- `consultantId`：从 `req.user.sub` 写入，不能留空。
- `UpdateRecommendationStatusDto`：枚举校验，非法状态返回 `400`。
- `ScheduleInterviewDto`：面试时间、面试轮次、备注、面试官可选。
- 操作审计：记录谁在何时把推荐推进到哪个状态。

验收标准：

- 在匹配页点击“推荐”后，交付看板出现该记录。
- “安排面试/通过当前阶段/淘汰此人”能更新状态，并在刷新后保持。
- 失败时返回可读 `4xx`，不能落到 `500`。

### 4.2 推荐报告与话术生成

前端来源：

- `apps/web/src/app/(app)/jobs/[id]/matches/page.tsx`

当前问题：

- 前端先创建推荐，再取 `GET /recommendations/:id/report`。
- 后端创建推荐当前容易因 `consultantId` 缺失失败。
- `GET /recommendations/:id/outreach` 后端有接口，但前端没有入口。

建议补齐：

- 把“生成报告”设计为幂等任务，可同步返回缓存，也可返回 jobId。
- 报告生成失败时保留推荐记录，不影响后续交付。
- 将 outreach 文案接入推荐详情或交付看板侧栏。

---

## 5. P1：合同模板与合同详情

### 5.1 合同模板接口接入

前端来源：

- `apps/web/src/app/(app)/contracts/page.tsx`
- 当前状态：模板列表是本地 `TEMPLATES` 常量，下载按钮无请求。

后端现状：

- 已暴露 `GET /contracts/templates`。

建议接口返回：

```json
{
  "items": [
    {
      "id": "service",
      "name": "猎头服务合作协议",
      "description": "适用于客户签约",
      "fileName": "service-agreement.docx",
      "downloadUrl": "/api/contracts/templates/service/download"
    }
  ]
}
```

建议补充：

```http
GET /api/contracts/templates/:id/download
```

验收标准：

- 模板抽屉从后端加载。
- 点击下载能拿到文件流，文件名正确。
- 未授权用户不可下载。

### 5.2 合同详情与状态动作

前端来源：

- 合同表格已有“查看”按钮，但未接 `GET /contracts/:id`。

建议补齐：

- 详情抽屉：合同基本信息、文件预览/下载、关联企业、关联发票、状态历史。
- 状态动作：草稿、待审批、生效、完成、终止。
- 前端使用 `PATCH /contracts/:id/status`。

---

## 6. P2：分析页指标契约

前端来源：

- `apps/web/src/app/(app)/analysis/page.tsx`
- `apps/web/src/app/(app)/dashboard/page.tsx`

后端现状：

- 已有 `GET /analytics/overview`
- 已有 `GET /analytics/delivery-funnel`
- 已有 `GET /analytics/talent-stats`，但前端未接入。

建议统一响应：

```ts
interface AnalyticsOverview {
  candidateCount: number;
  jobCount: number;
  recommendationCount: number;
  acceptedCount: number;
  activeEnterpriseCount: number;
  contractAmount: number;
}

interface DeliveryFunnelItem {
  status: string;
  label: string;
  count: number;
  conversionRate?: number;
}

interface TalentStats {
  byLocation: Array<{ name: string; value: number }>;
  bySkill: Array<{ name: string; value: number }>;
  bySeniority: Array<{ name: string; value: number }>;
}
```

验收标准：

- dashboard 与 analysis 使用同一套字段，不再各自兜底猜结构。
- 空数据返回 `0` 和空数组，不返回 `null`。
- 所有统计必须按 `tenantId` 过滤。

---

## 7. 前端已设计但建议先隐藏的能力

这些功能目前更像“产品预告”，后端投入较大。如果短期不开发，建议先隐藏或加 disabled 状态，避免用户以为已经可用。

| 前端能力               | 当前位置       | 建议                                            |
| ---------------------- | -------------- | ----------------------------------------------- |
| MFA 多因素认证         | 设置页安全设置 | 需要完整登录挑战流程，短期隐藏                  |
| API Key 管理           | 设置页安全设置 | 需要 token hash、权限范围、撤销、审计，单独排期 |
| 登录审计日志           | 设置页安全设置 | 需要 audit log 中间件和查询页，先隐藏           |
| GLM-4 增强解析开关     | 设置页 AI 配置 | 等 LLM provider 配置统一后再开放                |
| 全链路向量空间映射开关 | 设置页 AI 配置 | 当前应作为系统能力，不适合作为用户开关          |
| 自动邀约话术生成       | 设置页 AI 配置 | 后端已有能力但缺 UI 入口和配额控制              |

---

## 8. 开发顺序建议

### Phase 1：修复可见坏链路

1. `PATCH /auth/profile`
2. `GET/PATCH /settings/config`
3. 推荐创建 DTO、`consultantId`、错误处理
4. 基础契约测试：前端调用的接口必须在后端存在

预期效果：

- 设置页不再 404/保存失败。
- 匹配页推荐动作不再 500。
- 线上错误率下降，用户可见的“假按钮”减少。

### Phase 2：补齐交付闭环

1. 推荐状态推进
2. 面试安排
3. AI 话术入口
4. 推荐报告异步化或缓存化

预期效果：

- “推荐候选人 -> 交付看板 -> 约面/淘汰/通过 -> 报告/话术”闭环成立。

### Phase 3：合同与财务扩展

1. 模板接口接入
2. 合同详情与状态流转
3. 发票模块前端入口
4. 保活期/回款节点联动

预期效果：

- 后端已开发的合同/发票/保活能力开始产生真实产品价值，而不是静态暴露接口。

### Phase 4：治理与契约自动化

1. Nest 生成 OpenAPI。
2. 前端基于 OpenAPI 生成 typed client。
3. CI 增加“前端 API 调用必须存在于 OpenAPI”的检查。
4. 对 experimental UI 建立目录和 tsconfig 排除策略。

预期效果：

- 前后端接口漂移从人工 review 问题变成 CI 问题。
- 废弃代码和未来功能不再混入生产路径。

---

## 9. Definition of Done

每个接口补齐任务完成时，至少满足：

- Controller 有 DTO 校验。
- Service 按 `tenantId` 过滤。
- 非法输入返回 `400`，未授权返回 `401/403`，找不到返回 `404`。
- 有单元测试或 e2e 覆盖成功与失败路径。
- 前端去掉本地 mock 或隐藏状态。
- 文档中的接口状态从 `planned` 更新为 `implemented`。

---

## 10. 后续维护方式

建议在每次新增前端接口调用时同步更新本文：

```md
| 优先级 | 前端位置 | 当前前端能力 | 后端现状 | 建议处理 |
```

如果一个能力只是未来设想，不应直接接入生产 UI；应放入 `experimental` 页面或 feature flag 后面，并在本文标注 owner、目标版本和验收标准。
