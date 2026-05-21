# 合同 Phase 1/2 全面测试问题文档与解决方案

日期：2026-05-20  
范围：Phase 1 模板与生成引擎；Phase 2 富文本编辑、AI 评估、签署事务与到期提醒  
测试方式：后端单测、前后端构建、静态检查、API 验证、Playwright Chromium 真实浏览器人工流程模拟  
参考说明：`/Users/lee/.gemini/antigravity-ide/brain/626f88ad-29e9-443c-bfcc-d05a4b1d0a4e/walkthrough.md`

## 1. 执行摘要

本轮测试完成了合同模块 Phase 1/2 的主路径验证：用户登录、合同列表、在线向导生成合同、选择模板、选择企业、填写变量、生成预览、进入富文本编辑页、模拟人工输入、自动保存、正式签署归档、合同列表回流、企业合同全景统计查看。主链路在修复两个阻断问题后可以跑通，生成合同被正式化并写入 `contracts`，审计日志也正常产生。

同时发现 6 类需要后续处理的问题：

| 优先级 | 问题 | 当前状态 | 影响 |
| --- | --- | --- | --- |
| P0 | TypeORM nullable union 字段未声明数据库类型导致 API 无法启动 | 已修复 | 阻断本地与生产启动 |
| P0 | `/contracts/templates` 被 `/contracts/:id` 抢占导致模板接口异常 | 已修复 | 阻断模板列表与生成向导 |
| P1 | AI SSE 风险评估失败时只给裸 error 事件，前端无法展示具体原因 | 待修复 | 影响 AI 评估可用性和排障 |
| P1 | 企业状态流转自动创建跟进记录时 `user_id` 为空 | 待修复 | 状态变更 500，影响客户阶段管理 |
| P1 | 正式合同标题/备注丢失真实模板名 | 待修复 | 合同列表、全景和审计可读性下降 |
| P2 | 合同实体 UUID 字段类型未显式声明，存在 schema drift 风险 | 待修复 | 关联查询、迁移一致性和生产稳定性风险 |
| P2 | 静态检查与浏览器控制台存在遗留警告 | 待修复 | CI 噪声、前端体验和升级风险 |

## 2. 测试环境与账号

- 本地仓库：`/Users/lee/Desktop/YZSCHROS`
- API：`http://localhost:3001`
- Web：`http://localhost:3003`
- 数据依赖：本地 Docker Postgres、Redis、MinIO，启动前已处于 healthy
- 浏览器模拟：Playwright Chromium
- 测试用户：`qa-contract-1779288876016@example.com`
- 测试企业：`合同QA企业-1779288876016`
- 企业 ID：`6e33481b-baa8-4dd9-86de-dddbfc3de5bf`
- 测试合同生成号：`GEN-20260520-2NYJ0K`

说明：Codex in-app Browser 工具当时不可用，因此使用 Playwright Chromium 作为真实浏览器自动化替代。

## 3. 已执行质量门禁

| 命令 | 结果 | 备注 |
| --- | --- | --- |
| `pnpm --filter @yzschros/api test` | 通过 | 28 个 suites / 79 个 tests 通过；日志中有测试预期的 429 warning |
| `pnpm --filter @yzschros/api build` | 通过 | 在 P0 entity 类型修复后通过 |
| `pnpm --filter @yzschros/web build` | 通过 | 有 Next root 推断和 middleware convention 警告 |
| `pnpm --filter @yzschros/web lint:ci` | 通过 | exit 0，但有 173 条 warning |
| `pnpm --filter @yzschros/api exec eslint "{src,apps,libs,test}/**/*.ts" --quiet` | 未通过 | 2 个遗留错误，位于 `apps/api/src/modules/import/legacy-import.cli.ts` 207-208 |

API quiet lint 错误为 `@typescript-eslint/no-base-to-string`，不属于本轮合同 Phase 1/2 新增主链路，但建议纳入技术债清理，否则会继续阻断“全仓严格静态检查”。

## 4. 浏览器人工流程模拟结果

### 4.1 主链路

浏览器模拟完成以下操作：

1. 登录测试账号。
2. 打开 `/contracts`。
3. 点击“在线向导生成合同”。
4. 选择“标准劳动合同模板”。
5. 选择企业“合同QA企业-1779288876016”。
6. 填写变量：
   - 统一社会信用代码：`91310000MA1QA20260`
   - 员工姓名：`王小明`
   - 身份证号：`310101199001011234`
   - 开始日期：`2026-06-01`
   - 结束日期：`2027-05-31`
   - 岗位：`高级前端工程师`
   - 月薪：`28000`
7. 生成合同预览，预览内容包含 `王小明` 和 `28000`。
8. 进入编辑页，模拟人工输入补充条款：
   `补充测试条款：本合同由 Playwright 模拟人工输入，用于验证自动保存。`
9. 等待自动保存，页面按钮变为“内容已保存”。
10. 点击 AI 条款评估，触发 SSE 异常，详见问题 P1-01。
11. 点击正式签署归档，完成归档并返回合同列表。
12. 打开企业详情页合同全景，看到合同统计。

### 4.2 数据库/API 验证

测试后数据库状态：

- `contract_generations.status = formalized`
- `contract_generations.edited_content` 包含 Playwright 人工输入文本
- `contracts` 中存在正式合同：
  - 合同编号：`GEN-20260520-2NYJ0K`
  - 标题：`在线生成合同-GEN-20260520-2NYJ0K`
  - 金额：`28000.00`
  - 状态：`active`
  - 企业 ID：`6e33481b-baa8-4dd9-86de-dddbfc3de5bf`
  - 生成记录 ID：`c58a638b-0a43-459b-830f-f4d000e07bd4`
- `contract_audit_logs` 对该生成记录有 1 条 formalize 审计日志
- 企业合同全景统计：
  - 总合同数：1
  - 生效合同数：1
  - 即将到期：0
  - 合同总额：¥28,000

结论：模板选择、变量渲染、富文本编辑、自动保存、正式签署事务、合同全景统计主路径基本可用。

## 5. 已修复阻断项

### P0-01 TypeORM 字段类型推断失败导致 API 无法启动

现象：

API 启动时报错：

```text
DataTypeNotSupportedError: Data type "Object" in "ContractTemplateEntity.tenantId" is not supported by "postgres" database.
```

根因：

TypeScript 字段使用 `string | null` 时，TypeORM runtime metadata 只能推断为 `Object`。如果 `@Column()` 未显式声明 `type`，Postgres driver 无法映射数据库类型。

已修复文件：

- `apps/api/src/entities/contract-template.entity.ts`
  - `tenant_id` 显式声明 `type: 'uuid'`
  - `description` 显式声明 `type: 'text'`
  - `file_url` 显式声明 `type: 'text'`
  - `parent_id` 显式声明 `type: 'uuid'`
- `apps/api/src/entities/contract-generation.entity.ts`
  - `enterprise_id` 显式声明 `type: 'uuid'`
  - `contract_id` 显式声明 `type: 'uuid'`

验证：

- API 可正常启动。
- `pnpm --filter @yzschros/api build` 通过。
- 浏览器合同生成主链路可跑通。

后续建议：

全仓扫描所有实体字段，只要 TypeScript 类型包含 `| null`、`?` 或语义上是 UUID，都应显式声明数据库类型，避免下一次 runtime 才暴露。

### P0-02 合同控制器路由顺序导致 `/contracts/templates` 被误识别为 `:id`

现象：

合同模板接口被泛化路由 `/contracts/:id` 捕获，导致打开合同生成向导时模板列表异常。

根因：

Nest controller 注册顺序中，`ContractController` 的 `:id` 动态路由优先匹配了 `/contracts/templates`。

已修复文件：

- `apps/api/src/modules/contract/contract.module.ts`
  - controllers 顺序调整为：
    - `ContractTemplateController`
    - `ContractGenerationController`
    - `ContractController`

验证：

- 生成向导可正常列出模板。
- 浏览器可选择“标准劳动合同模板”并生成预览。

后续建议：

保留当前注册顺序，同时为模板和生成记录 controller 增加集成测试，覆盖：

- `GET /contracts/templates`
- `GET /contracts/generations`
- `GET /contracts/:id`

## 6. 待修复问题与解决方案

### P1-01 AI SSE 风险评估失败时没有结构化错误

现象：

在合同编辑页点击 AI 条款评估后，服务端返回 `200 text/event-stream`，先推送一条 progress，然后推送裸 error 事件：

```text
event: error
id: 2
```

前端只能显示：

```text
AI 评估连接意外中断
```

服务端日志显示 `LlmClientService AI 接口失败 (Local, 1..4)`，本地 AI provider 不可用或配置不可访问。

影响：

- 用户不知道是 AI 服务未配置、网络失败、鉴权失败还是模型返回格式错误。
- SSE 流中断后没有可恢复状态，不能给出“稍后重试/联系管理员/切换 provider”的明确动作。
- 自动化测试只能判定失败，无法验证 AI 评估业务结果。

代码位置：

- `apps/api/src/modules/contract/contract-generation.service.ts:145` 起 `assessRiskStream`
- `apps/api/src/modules/contract/contract-generation.service.ts:269` catch 中调用 `subscriber.error(e)`
- `apps/web/src/app/(app)/contracts/[id]/edit/page.tsx:319` 起 `handleAiAssess`
- `apps/web/src/app/(app)/contracts/[id]/edit/page.tsx:353` 只在 `onerror` 里展示通用错误

解决方案：

1. 后端不要用 `subscriber.error(e)` 结束业务失败。
2. 后端 catch 中发送结构化业务错误，然后 `complete()`：

```ts
subscriber.next({
  status: 'error',
  code: 'AI_PROVIDER_UNAVAILABLE',
  message: normalizeAiError(e),
  retryable: true,
});
subscriber.complete();
```

3. 前端在 `onmessage` 中处理 `data.status === 'error'`：

```ts
if (data.status === 'error') {
  setAiStepMsg(data.message || 'AI 服务暂时不可用');
  message.error(data.message || 'AI 服务暂时不可用，请稍后重试');
  eventSource.close();
  setAiLoading(false);
  return;
}
```

4. `onerror` 仅保留给网络断开、鉴权失效、Nginx/SSE 连接异常。
5. 增加 AI provider preflight：
   - API 启动时记录当前 provider 和可用性。
   - 管理端或编辑页可调用 `/ai/health` 或复用已有 health check。
   - 未配置 provider 时，按钮提示“AI 服务未配置”，避免用户进入长等待。
6. 增加测试：
   - mock LLM 成功：应产生 completed report 并保存 `riskAssessment`。
   - mock LLM 抛错：SSE 应输出 `{ status: 'error' }`，前端展示明确错误。

验收标准：

- AI provider 不可用时，前端显示明确原因。
- SSE 返回结构化错误事件，不再出现只有 `event: error` 且无 `data` 的情况。
- 后端日志包含 provider、错误码、request id 或 generation id。
- AI 成功路径可保存报告，刷新页面后仍可查看。

### P1-02 企业状态流转自动跟进记录缺少 `user_id`

现象：

调用企业状态流转接口，例如将企业从 `potential` 切到 `following`，接口返回 500：

```text
null value in column "user_id" of relation "follow_ups" violates not-null constraint
```

影响：

- 企业客户阶段无法正常更新。
- 与合同生成联动时，客户生命周期状态无法可靠推进。
- 自动跟进日志本意是审计行为，但实际导致主操作失败。

代码位置：

- `apps/api/src/modules/enterprise/enterprise.service.ts:177`
- `apps/api/src/modules/enterprise/enterprise.service.ts:189` 创建 `FollowUpEntity` 时未传 `userId`

根因：

`updateStatus(id, dto, tenantId?)` 只接收 tenantId，没有接收当前操作者。创建 `FollowUpEntity` 时缺少非空字段 `user_id`。

解决方案：

1. enterprise controller 调用 service 时传入当前用户，而不是只传 tenantId。
2. service 签名改为：

```ts
async updateStatus(id: string, dto: UpdateEnterpriseStatusDto, user: any) {
  const tenantId = user?.tenantId;
  const userId = user?.id || user?.sub;
}
```

3. 创建跟进记录时写入 `userId`：

```ts
const log = manager.create(FollowUpEntity, {
  targetType: 'enterprise',
  targetId: id,
  tenantId,
  userId,
  content: `系统自动记录：将客户状态从 [${oldStatus}] 修改为 [${dto.status}]`,
});
```

4. 如果系统允许 admin 跨租户操作，应明确 userId 来源和 tenantId 选择：
   - tenantId 优先来自企业记录自身；
   - userId 来自登录用户；
   - 禁止用空 UUID 兜底，除非 FollowUpEntity 明确支持 system actor。

5. 增加测试：
   - 合法状态流转应成功。
   - `follow_ups.user_id` 应等于当前用户 ID。
   - 非法状态流转仍应被 state machine 拦截。

验收标准：

- 企业状态变更返回 200。
- `follow_ups` 表新增日志，且 `user_id`、`tenant_id`、`target_id` 完整。
- 状态机非法转换仍返回 400，不写入跟进日志。

### P1-03 正式合同标题和备注丢失真实模板名

现象：

浏览器选择“标准劳动合同模板”生成并正式化后，正式合同标题为：

```text
在线生成合同-GEN-20260520-2NYJ0K
```

备注为：

```text
由模板【在线生成合同】自动在线渲染生成
```

预期应包含真实模板名，例如：

```text
标准劳动合同模板-GEN-20260520-2NYJ0K
```

影响：

- 合同列表、企业合同全景、审计日志可读性下降。
- 后续按模板类型筛选、统计和续签会缺少可靠展示字段。
- 用户容易以为合同不是从所选模板生成。

代码位置：

- `apps/api/src/modules/contract/contract-generation.service.ts:107` 创建 `templateSnapshot`
- `apps/api/src/modules/contract/contract-generation.service.ts:298` 正式化读取 `templateSnapshot?.name`

根因：

创建 generation 时，`templateSnapshot` 只保存了：

```ts
{
  templateContent,
  variables,
  version,
}
```

正式化时读取 `templateSnapshot?.name`，不存在则 fallback 到“在线生成合同”。

解决方案：

1. 扩展 `TemplateSnapshot` 类型，至少包含：

```ts
interface TemplateSnapshot {
  name: string;
  category: string;
  templateContent: string;
  variables: VariableDefinition[];
  version: string;
}
```

2. 创建 generation 时保存模板名和分类：

```ts
templateSnapshot: {
  name: template.name,
  category: template.category,
  templateContent: template.templateContent,
  variables: template.variables,
  version: template.version,
}
```

3. 正式化时兼容旧数据：

```ts
const templateName =
  templateSnapshot?.name ||
  (generation.templateId ? await loadTemplateName(generation.templateId) : null) ||
  '在线生成合同';
```

4. 增加测试：
   - 新 generation 正式化后标题包含模板名。
   - 旧 generation 快照缺 name 时仍可正式化。

验收标准：

- 新生成正式合同标题含真实模板名。
- 备注含真实模板名和版本号。
- 旧数据不阻断 formalize。

### P2-01 合同实体 UUID 字段类型未显式声明，存在 schema drift 风险

现象：

本地数据库执行类似 join 时出现过类型不一致：

```text
operator does not exist: uuid = character varying
```

例如 `contracts.generation_id` 与 `contract_generations.id` 做关联时，前者可能被同步为 varchar，后者是 uuid。

影响：

- 本地、测试、生产环境如果建表路径不同，字段类型可能不一致。
- 关联查询、统计、迁移脚本和 TypeORM synchronize 行为可能出现不可预测差异。
- 后续到期提醒、续签来源、生成记录反查正式合同都会受影响。

代码位置：

- `apps/api/src/entities/contract.entity.ts:15`
- `apps/api/src/entities/contract.entity.ts:19`
- `apps/api/src/entities/contract.entity.ts:52`
- `apps/api/src/entities/contract.entity.ts:56`

解决方案：

1. 为 `ContractEntity` 中所有 UUID 语义字段显式声明类型：

```ts
@Column({ name: 'tenant_id', type: 'uuid', nullable: true })
tenantId: string | null;

@Column({ name: 'enterprise_id', type: 'uuid' })
enterpriseId: string;

@Column({ name: 'generation_id', type: 'uuid', nullable: true })
generationId: string | null;

@Column({ name: 'renewed_from', type: 'uuid', nullable: true })
renewedFrom: string | null;
```

2. 检查 migration `007-contract-redesign.sql` 与 entity 是否完全一致。
3. 对已经 drift 的本地或测试数据库，使用显式 migration 修复：

```sql
ALTER TABLE contracts
  ALTER COLUMN generation_id TYPE uuid USING generation_id::uuid,
  ALTER COLUMN renewed_from TYPE uuid USING renewed_from::uuid;
```

4. 若历史数据存在 `'unknown'` 这类非 UUID 值，需要先清理或改为 `NULL`，不能直接转换。

验收标准：

- `contracts.generation_id`、`contract_generations.id` 均为 uuid。
- generation 到正式合同的关联查询可以直接 join。
- TypeORM entity、migration、数据库实际 schema 三者一致。

### P2-02 API quiet lint 存在遗留错误

现象：

运行：

```bash
pnpm --filter @yzschros/api exec eslint "{src,apps,libs,test}/**/*.ts" --quiet
```

失败，错误位于：

- `apps/api/src/modules/import/legacy-import.cli.ts:207`
- `apps/api/src/modules/import/legacy-import.cli.ts:208`

错误类型：

```text
@typescript-eslint/no-base-to-string
```

影响：

- 严格 CI 无法用作最终质量门禁。
- 合同模块本身通过构建和单测，但全仓静态检查仍不能宣称完全干净。

解决方案：

1. 打开对应两行，避免直接将 object/unknown 插入模板字符串或调用隐式 `String()`。
2. 根据真实类型选择：
   - 如果是 Error：使用 `error instanceof Error ? error.message : JSON.stringify(error)`。
   - 如果是对象：使用安全序列化 helper。
   - 如果是 CLI 输出：明确取 `.message`、`.code` 或 `.detail`。
3. 加一条针对 legacy import CLI 错误分支的轻量测试，避免未来恢复隐式 toString。

验收标准：

- API quiet lint exit 0。
- 原有导入 CLI 错误输出仍保持可读。

### P2-03 前端控制台 hydration、Tiptap 和 Ant Design 警告

现象：

浏览器测试中看到以下非阻断警告：

- 登录页 hydration mismatch，疑似首屏随机粒子/星点样式在 SSR 与 client 不一致。
- 合同列表页 ProTable query filter responsive class 存在 hydration mismatch。
- Tiptap 警告 duplicate extension names：`['underline']`。
- Ant Design 兼容警告：
  - `Spin tip`
  - `Card bordered/bodyStyle`
  - `Progress width`
  - `Breadcrumb.Item`

影响：

- 虽不阻断合同主流程，但会污染控制台并降低调试效率。
- hydration mismatch 可能在生产 SSR 下造成不稳定首屏 UI。
- Ant Design deprecated API 会增加未来升级成本。

解决方案：

1. 登录页随机视觉元素改为 client-only：
   - SSR 输出稳定占位；
   - `useEffect` 后生成随机位置；
   - 或使用固定 seed 生成 deterministic 样式。
2. ProTable hydration mismatch：
   - 检查 query filter 是否依赖 viewport 在服务端和客户端产生不同 class；
   - 必要时对该区域 client-only 渲染，或固定 SSR 默认布局。
3. Tiptap underline 重复：
   - 检查 StarterKit 当前版本是否已经包含 underline；
   - 如已包含，移除额外 `Underline` extension；
   - 如必须自定义，则用 StarterKit 配置排除内置扩展。
4. Ant Design deprecated API：
   - `Card bordered` 改 `variant`
   - `bodyStyle` 改 `styles.body`
   - `Breadcrumb.Item` 改 `items`
   - `Progress width` 按当前 antd 版本推荐属性替换
   - `Spin tip` 按新版嵌套模式调整

验收标准：

- 合同主流程跑完后浏览器 console 无 hydration mismatch。
- Tiptap 不再输出 duplicate extension names。
- Ant Design deprecated warning 明显减少或归零。

## 7. 建议修复顺序

1. P1-01 AI SSE 结构化错误：直接影响 Phase 2 AI 评估的可用性和可测试性。
2. P1-02 企业状态流转 `user_id`：影响客户生命周期基础能力，且修复范围明确。
3. P1-03 模板快照补齐 `name/category`：影响正式合同展示和后续统计。
4. P2-01 UUID schema hardening：建议与 migration 校验一起处理，防止环境漂移。
5. P2-02 API quiet lint：清理 CI 阻断噪声。
6. P2-03 前端控制台警告：体验与升级债务，适合作为前端 polish 批次。

## 8. 回归测试清单

每次修复后建议执行：

```bash
pnpm --filter @yzschros/api test
pnpm --filter @yzschros/api build
pnpm --filter @yzschros/web build
pnpm --filter @yzschros/web lint:ci
pnpm --filter @yzschros/api exec eslint "{src,apps,libs,test}/**/*.ts" --quiet
```

浏览器回归建议覆盖：

1. 合同生成向导能列出模板。
2. 选择模板后变量表单完整显示必填字段。
3. 缺少必填变量时后端返回明确错误。
4. 填写变量后预览内容包含用户输入值。
5. 编辑页人工输入后 3 秒左右自动保存。
6. 刷新编辑页后编辑内容仍存在。
7. AI provider 可用时评估完成并保存报告。
8. AI provider 不可用时展示结构化错误。
9. 正式签署后生成 `contracts` 记录。
10. 重复正式签署应被拒绝。
11. `contract_audit_logs` 有 formalize 审计日志。
12. 企业合同全景统计合同数量、金额、状态正确。
13. 到期提醒 cron 可识别即将到期合同，并更新/记录提醒状态。

## 9. 本轮结论

合同 Phase 1/2 的核心业务链路已具备可运行基础：模板渲染、富文本编辑、自动保存、正式化事务、审计日志与企业合同全景均已通过真实浏览器主路径验证。当前最需要补齐的是 AI SSE 的失败可观测性、企业状态流转的操作者写入、正式合同元数据完整性，以及 UUID schema 的长期一致性。

建议在进入下一阶段前，至少完成 P1-01、P1-02、P1-03，并用本文件第 8 节清单做一次完整回归。
