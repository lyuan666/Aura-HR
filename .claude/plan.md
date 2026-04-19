# YZSCHROS QA 报告

**日期**: 2026-04-18
**分支**: `chore/code-review-optimization`
**测试范围**: 全站前端页面 + API 认证流程
**环境**: macOS, Node.js, Next.js 16 + NestJS

---

## 发现的问题

### P0 - 已修复

| # | 问题 | 根因 | 修复 |
|---|------|------|------|
| 1 | **所有 API 请求返回 401** | JWT 签发和验证使用不同的 secret。`JwtModule.register()` 在 ConfigModule 加载前执行，fallback 到 `dev-secret-key`。`JwtStrategy` 延迟实例化，拿到 `.env` 中的真实值。 | auth.module.ts 改为 `JwtModule.registerAsync()` + ConfigService；jwt.strategy.ts 同样注入 ConfigService |
| 2 | **所有前端 API 调用无 Authorization header** | 前端直接 `import axios` 或裸 `fetch`，没有注入 JWT token | 创建 `apps/web/src/lib/api.ts` 统一 axios 实例 + 请求拦截器，替换全部 11 处直接调用 |
| 3 | **Jobs 页面崩溃 `data.filter is not a function`** | API 返回 401 时 `res.json()` 返回对象 `{message: "Unauthorized"}` 而非数组，`data.filter()` 崩溃 | 改用 api 实例 + `Array.isArray()` 安全检查 |
| 4 | **jobs/[id]/matches JSX 结构错误** | `</Card>` 和 `</Col>` 标签缺失，`<Modal>` 组件缺少 import，`<Table>` 未闭合 | 完整重写该页面，修复 JSX 嵌套和缺失 import |

### P1 - 存在但非阻塞

| # | 问题 | 影响 | 建议 |
|---|------|------|------|
| 5 | Dashboard/Candidates 等页面全量硬编码 mock 数据 | 页面显示非真实数据，无法验证业务逻辑 | 后续需逐一替换为真实 API 数据绑定 |
| 6 | Candidates 页面无数据时仍显示分页控件 | 用户困惑 | 添加条件判断，`candidates.length === 0` 时隐藏 Pagination |
| 7 | Contracts 页面汇总卡片与表格数据矛盾 | 卡片显示"0份活跃合同"，表格却有1份"执行中"合同 | mock 数据同步问题，接入真实 API 后自动解决 |
| 8 | Delivery 页面所有候选人评语相同 | 复制粘贴的 mock 文本 | 接入真实 AI 分析后解决 |
| 9 | Settings 页面编辑控件 UI 不一致 | 部分条目显示三点菜单，部分显示"重命名/移除"链接 | 统一交互模式 |
| 10 | 前端图表宽度警告 | Ant Design Chart 容器 `-1` 宽度 | 确保容器有明确宽度 |

### P2 - 代码质量

| # | 问题 | 文件 |
|---|------|------|
| 11 | enterprises/[id]/page.tsx TS 错误: `data.followUps` possibly undefined | 第 276 行 |
| 12 | DashboardContainer.tsx react-grid-layout 类型不匹配 | Layout 类型定义 |
| 13 | settings/page.tsx Tag 组件不支持 `size` 属性 | 第 84 行 |

---

## 修复文件清单

### 新建
- `apps/web/src/lib/api.ts` - 统一 axios 实例，JWT 拦截器

### 修改
- `apps/api/src/modules/auth/auth.module.ts` - JwtModule.registerAsync + ConfigService
- `apps/api/src/modules/auth/jwt.strategy.ts` - 注入 ConfigService 获取 secret
- `apps/web/src/app/(app)/dashboard/page.tsx` - axios → api
- `apps/web/src/app/(app)/candidates/page.tsx` - axios → api
- `apps/web/src/app/(app)/jobs/page.tsx` - fetch → api + 数组安全检查
- `apps/web/src/app/(app)/jobs/[id]/matches/page.tsx` - 重写（JSX 修复 + fetch → api）
- `apps/web/src/app/(app)/delivery/page.tsx` - fetch → api
- `apps/web/src/app/(app)/enterprises/page.tsx` - axios → api
- `apps/web/src/app/(app)/enterprises/[id]/page.tsx` - axios → api
- `apps/web/src/app/share/[token]/page.tsx` - fetch → api
- `apps/web/src/components/candidates/ResumeUploadModal.tsx` - axios → api
- `apps/web/src/components/jobs/SmartJobCreationModal.tsx` - fetch → api
- `apps/web/src/components/dashboard/DashboardContainer.tsx` - axios → api

---

## 验证结果

| 测试 | 修复前 | 修复后 |
|------|--------|--------|
| 登录 API | 200 (token 签发成功) | 200 (token 签发成功) |
| Jobs API (带 token) | 401 | 200 ([]空数组) |
| Jobs 页面 | 崩溃 (TypeError) | 正常加载（空状态） |
| Dashboard 控制台 | 10+ 401 错误 | 零错误 |
| Jobs/[id]/matches | JSX 编译错误 | 正常加载 |

---

**STATUS: DONE_WITH_CONCERNS**

核心认证链路已修复，所有页面可正常加载。但全站仍使用 mock 数据，需要后续逐页面接入真实 API。
