# 猎头公司管理智能系统 - 开发人员指南

本指南旨在为团队成员提供统一的开发规范和技术指引，确保系统架构的一致性与高度可维护性。

---

## 1. 后端架构 (NestJS)

### 1.1 核心选型
- **框架**: NestJS (v11+)
- **ORM**: TypeORM
- **数据库**: PostgreSQL 16 + pgvector (用于 AI 匹配)
- **AI 引擎**: 智谱 AI (GLM-4 / embedding-3)

### 1.2 全局规范
- **代码校验**: 强制执行 ESLint 严格规则。禁止使用 `any`，必须提供接口/类定义。
- **DTO 验证**: 所有入口数据必须通过 `class-validator` 且在 Controller 使用 DTO。
- **拦截器**: 全局错误处理拦截器负责将异常转化为统一标准的 JSON 响应。

### 1.3 核心业务流
- **向量化流程**: 候选人入库后，需触发异步 `EmbeddingService` 调用，生成 2048 维向量存入 `embedding` 列。
- **匹配引擎**: 搜索时结合 Keyword 检索 (SQL) 与 Vector 检索 (Cosine Distance)，使用 RRF 算法加权打分。

---

## 2. 前端实现 (Next.js)

### 2.1 核心选型
- **框架**: Next.js 14+ (App Router)
- **UI 组件**: Ant Design (Premium 定制化)
- **样式**: Vanilla CSS + 现代 CSS 变量
- **状态管理**: React Hooks / Context API

### 2.2 UI/UX 设计原则
- **色彩规范**: 
  - 主色: `#4f46e5` (靛蓝)
  - 成功: `#10b981` (祖母绿)
  - 警告: `#f59e0b` (橙黄)
- **美学要求**: 必须遵循“Rich Aesthetics”原则，使用毛玻璃效果 (Glassmorphism)、流畅过度动画及响应式布局。

### 2.3 开发建议
- **类型安全**: 所有向 API 发起的请求需定义 Response 类型。
- **组件化**: 通用 Table、Form 封装为业务组件，避免页面逻辑冗长。

---

## 3. 数据库操作指南

### 3.1 基础设施要求
**重要**: 系统核心功能依赖 `pgvector` 扩展。
- **检查命令**: `SELECT * FROM pg_extension WHERE extname = 'vector';`
- **启用步骤**:
  1. 确保使用支持 vector 的镜像 (如 `ankane/pgvector`)。
  2. 执行 `CREATE EXTENSION IF NOT EXISTS vector;`

### 3.2 模式管理
- **同步方式**: 开发环境建议使用 `sync: true`，生产环境强制使用 Migration。
- **迁移命令**: `npm run migration:generate -- -n InitialSchema`

---

## 4. AI 服务接入规范

### 4.1 环境准备
在 `.env` 中配置以下变量：
```bash
ZHIPU_API_KEY=your_key_here
ZHIPU_EMBEDDING_MODEL=embedding-3
```

### 4.2 解析策略
- **解析简历**: 调用 `AiService.parseResume`。
- **JD 增强**: 使用结构化模板将原始 JD 转换为任务驱动型格式，用于向量空间对齐。

---

## 5. 常见问题 (FAQ)

- **Q: 为什么向量匹配失败？**
  - A: 检查数据库 `embedding` 列是否存在，且对应候选人的向量数据已生成。
- **Q: Lint 报错如何处理？**
  - A: 禁止绕过 Lint，必须修正类型定义。

---

© 2026 YZSCHROS Team. 保持代码简洁，拥抱 AI 生产力。
