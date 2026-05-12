# YZSCHROS 多功能开发计划 v2

> 分支: `feat/multi-feature-optimization`
> 日期: 2026-05-11
> 基于: 最新已提交代码（notification module, client portal, mobile CSS 已就位）

---

## 现状分析

### 已完成
- **飞书通知模块**：后端 `NotificationModule` 完整（webhook 配置 + 4 种事件推送 + 测试），前端设置页 `FeishuNotificationSettings` 可用
- **甲方 HR 端**：`/client/login` magic-link 认证 + `/client/dashboard` 查看职位/推荐/状态更新，后端 `ClientPortalController` 完整
- **主题系统**：CSS 变量双主题 + AntdProvider 动态切换 + 防闪烁 + hover tokens
- **移动端 CSS 基础**：`globals.css` 有 `@media (max-width: 640px)` 框架

### 核心问题
1. **83 处硬编码颜色**（`#0B0D11`, `#6C5CE7`, `#555762` 等）分布在 11 个文件，明亮模式下全部失效
2. **字体无全局规范**：各组件随意使用 `text-[10px]`, `text-[11px]`, `text-[13px]` 等 8+ 种非标准字号
3. **移动端只做了一半**：V2Sidebar 固定 108px 宽无收起机制，无汉堡菜单，无底部导航
4. **飞书通知未接入业务**：`match-push.processor.ts:33` 仍是 `TODO`，`recommendation.service.ts` 未调通知
5. **甲方 HR 端无飞书/钉钉适配**：独立暗色硬编码，无法嵌入第三方平台

---

## 工作流 1: UI 全局治理（暗色模式配色统一 + 字体规范 + 移动端）

### 1.1 暗色模式配色统一

**问题**：系统中存在两套暗色风格混用：
- 主系统用 `#121212 / #1C2128 / #2D333B` 灰蓝调
- SmartJobCreationModal / Client Portal / ResumeUploadModal 用 `#0B0D11 / #6C5CE7 / #A29BFE` 紫调

**方案**：统一为一套暗色配色。`#6C5CE7` 紫色保留作为「AI 功能专属强调色」，但不能替代全局 `brand-primary`。

**定义新增 CSS tokens**：

```css
/* globals.css @theme 新增 */
--color-ai-primary: #6C5CE7;        /* AI 功能专属紫色 */
--color-ai-primary-light: #A29BFE;  /* AI 紫色浅色 */
--color-ai-bg: #0F1117;             /* AI 功能区专属深色背景 */
--color-ai-bg-surface: #141620;     /* AI 功能区表面色 */
```

**修改文件清单（83 处硬编码颜色）**：

| 文件 | 硬编码数 | 方案 |
|------|---------|------|
| `components/jobs/SmartJobCreationModal.tsx` | 23 | `#0B0D11` → `bg-ai-bg`, `#6C5CE7` → `bg-ai-primary`, `#555762` → `text-text-sub` |
| `components/candidates/ResumeUploadModal.tsx` | 17 | 同上模式 |
| `app/client/dashboard/page.tsx` | 14 | 客户端用独立品牌色，改为 CSS 变量 |
| `app/client/login/page.tsx` | 10 | 同上 |
| `app/client/login/verify/page.tsx` | 6 | 同上 |
| `app/(app)/analysis/page.tsx` | 4 | `#6C5CE7` → `bg-ai-primary` |
| `app/(app)/dashboard/page.tsx` | 2 | 同上 |
| 其他 4 个文件 | 7 | 逐个替换 |

### 1.2 字体全局规范

**问题**：散落使用 `text-[10px]`, `text-[11px]`, `text-[12px]`, `text-[13px]`, `text-[14px]`, `text-[16px]`, `text-[20px]`, `text-[24px]`, `text-[30px]`, `text-[2xl]`, `text-[2xl]`，无层级。

**方案**：建立 5 级字体规范。

| 层级 | Tailwind class | 大小 | 用途 |
|------|---------------|------|------|
| xs 标签 | `text-xs` | 12px | 角标、状态标签、表头 |
| sm 正文 | `text-sm` | 14px | 表格内容、列表项、次要信息 |
| base 主体 | `text-base` | 16px | 正文、表单输入、常规按钮 |
| lg 小标题 | `text-lg` | 18px | 卡片标题、section 标题 |
| xl 大标题 | `text-xl` / `text-2xl` | 20/24px | 页面标题 |

**Font weight 规范**：
- `font-normal` (400): 正文
- `font-medium` (500): 标签、导航项
- `font-semibold` (600): 卡片标题
- `font-bold` (700): 页面标题、强调数字

**执行**：全局搜索 `text-[1-3]\dpx` 和 `font-black`，替换为规范 class。涉及约 40+ 处。

### 1.3 移动端全局适配

**问题**：
- V2Sidebar 固定 108px 宽，移动端占 30% 屏幕
- 无汉堡菜单触发器
- 表格在移动端溢出
- 弹窗在小屏幕上被截断

**方案**：

**a) V2Sidebar 响应式**：
- `>= 768px`: 保持当前图标导航栏
- `< 768px`: 隐藏侧边栏，在 V2Header 左侧加汉堡菜单按钮，点击展开抽屉式导航

**b) 移动端表格**：
- 候选人列表、企业管理、面试管理表格加 `mobile-card-table` class
- `globals.css` 中已有对应样式，只需在组件上添加 class

**c) 弹窗适配**：
- `CandidateDetailModal` 已有 `sm:` 响应式 class
- 其他 Modal 补充 `sm:` 断点

**修改文件**：

| 文件 | 修改 |
|------|------|
| `components/v2/V2Sidebar.tsx` | 加 `hidden md:flex` + 汉堡菜单 state |
| `components/v2/V2Header.tsx` | 加汉堡菜单按钮 + `Drawer` 组件 |
| `app/(app)/candidates/page.tsx` | 表格加 `mobile-card-table` class |
| `app/(app)/enterprises/page.tsx` | 同上 |
| `app/(app)/interviews/page.tsx` | 同上 |
| `globals.css` | 扩展移动端 CSS（已有基础，补充 touch target、间距等） |

---

## 工作流 2: 飞书通知接入业务钩子

### 现状
后端 `NotificationModule` 已完成，`FeishuNotificationService.sendCardMessage()` 可用。但业务代码中无调用点。

### 修改文件

| 文件 | 修改点 |
|------|--------|
| `modules/recommendation/recommendation.service.ts` | `updateSchedule()` 后注入 `NotificationService`，发送面试提醒 |
| `modules/recommendation/recommendation.service.ts` | `updateStatus()` 状态变更时发送通知 |
| `modules/queue/match-push.processor.ts` | 替换 line 33 `TODO` 为 `NotificationService` 调用 |
| `modules/follow-up/follow-up.service.ts` | `handleReminders()` 中调用通知服务 |
| 以上 4 个模块的 `module.ts` | 注入 `NotificationModule` 依赖 |

### 降级策略
通知失败不影响主业务。用 try-catch 包裹，log error 继续。

---

## 工作流 3: 邮箱归集

### 后端 - 新建 EmailModule

**新依赖**：`imapflow` + `mailparser`

**新建文件**：

| 文件 | 用途 |
|------|------|
| `entities/email-account.entity.ts` | 邮箱账户（IMAP 凭证，密码 AES 加密） |
| `entities/email-message.entity.ts` | 邮件（关联候选人 ID） |
| `entities/email-attachment.entity.ts` | 附件（MinIO storage key） |
| `modules/email/email.module.ts` | NestJS 模块 |
| `modules/email/email.service.ts` | IMAP 同步 + mailparser 解析 |
| `modules/email/email.controller.ts` | REST API |
| `modules/email/email-linking.service.ts` | 邮件 ↔ 候选人自动匹配 |

### 前端

| 文件 | 修改 |
|------|------|
| `app/(app)/candidates/page.tsx` | "邮箱归集"按钮跳转到邮箱管理页 |
| 新建 `app/(app)/email/page.tsx` | 邮箱管理页面（账户配置 + 邮件列表） |
| 新建 `components/email/EmailAccountForm.tsx` | IMAP 配置表单 |
| 新建 `components/email/EmailList.tsx` | 邮件列表 + 关联候选人 |

### 核心流程
```
用户配置 IMAP → 定时同步(BullMQ/cron) → imapflow 拉取 → mailparser 解析
→ EmailLinkingService 按 email 匹配候选人 → 简历附件自动解析 → 存储
```

---

## 工作流 4: 甲方 HR 端增强（飞书/钉钉适配）

### 现状
`/client/` 路由下已有 magic-link 登录 + dashboard。硬编码暗色，无法嵌入第三方。

### 方案：H5 嵌套模式

甲方 HR 端作为独立 H5 应用，可嵌入飞书/钉钉的工作台（Workbench）内。两种访问方式并存：

1. **Web 直接访问**：`https://txos.top/client/login`（现有）
2. **飞书/钉钉工作台嵌入**：通过 iframe 嵌入，自动适配宿主平台主题

### 修改

**a) 主题适配**：
- 检测 `window.parent` 是否在飞书/钉钉 iframe 中
- 是：读取宿主平台传递的主题参数（通过 postMessage）
- 否：使用系统主题

**b) 钉钉登录集成**：
- 新增 `auth-client/dingtalk` 端点
- 使用钉钉扫码/H5 免登 API
- 环境变量：`DINGTALK_APP_KEY`, `DINGTALK_APP_SECRET`

**c) 去掉硬编码颜色**：
- 客户端 4 个页面替换 `#0B0D11` / `#6C5CE7` 为 CSS 变量
- 使用独立品牌色（可配置）

---

## 执行优先级

| 优先级 | 工作流 | 理由 |
|--------|--------|------|
| **P0** | 1.1 + 1.2 配色统一 + 字体规范 | 用户明确抱怨，影响所有页面 |
| **P1** | 1.3 移动端适配 | 用户明确要求，当前完全不可用 |
| **P2** | 2 飞书通知接入业务 | 后端已就位，只需 4 个注入点 |
| **P3** | 4 甲方 HR 端增强 | 已有基础，增量改造 |
| **P4** | 3 邮箱归集 | 全新模块，工作量最大 |

---

## GSTACK REVIEW REPORT

NO REVIEWS YET — run `/autoplan`
