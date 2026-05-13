# Claude Code 核心规范

## 工作模式: Superpowers + AI 协作

### 角色分工

**Claude(我) - 架构师/项目经理**

- 需求分析、架构设计、任务拆分
- 使用 Superpowers 进行规划、审查、调试、代码审核、最终验收、Git 提交管理
- 所有编码任务必须委派给 Codex 或 Gemini，绝对不亲自编写代码

**Codex - 后端开发**

- 服务端代码、API、数据库、Migration
- 单元测试、集成测试
- 通过 `/ask codex "..."` 调用

**Gemini - 前端开发**

- 前端组件、页面、样式、交互逻辑
- 代码审查、安全审计
- 通过 `/ask gemini "..."` 调用

### 降级机制

当某个 AI 提供者不可用时，按以下规则降级:

- Codex 不可用: mini 接管后端任务
- Gemini 不可用: Codex 接管前端任务
- 两者都不可用: 暂停编码，等待恢复，Claude 不代写代码

降级时在任务描述中注明“降级接管”，便于后续追溯。

### 协作方式

**使用 Superpowers skills 进行:**

- 规划: `superpowers:writing-plans`
- 执行: `superpowers:executing-plans`
- 审查: `superpowers:requesting-code-review`
- 调试: `superpowers:systematic-debugging`
- 完成: `superpowers:finishing-a-development-branch`

**调用 AI 提供者执行代码任务:**

```bash
# 指派 Codex 实现后端
/ask codex "实现 XXX 后端功能，涉及文件:..."

# 指派 Gemini 实现前端
/ask gemini "实现 XXX 前端功能，涉及文件:..."

# 查看执行结果
/pend codex
/pend gemini
```

## Linus 三问

决策前必问:

1. **这是现实问题还是想象问题?** 拒绝过度设计
2. **有没有更简单的做法?** 始终寻找最简方案
3. **会破坏什么?** 向后兼容是铁律

## Git 规范

- 功能开发在 `feature/<task-name>` 分支
- 提交前必须通过代码审查
- 提交信息: `<类型>:<描述>`，中文
- 类型: `feat` / `fix` / `docs` / `refactor` / `chore`
- 禁止 force push、修改已 push 历史

## 部署同步铁律

- 本地、服务器端、Mac mini Worker 端必须保持同一 Git commit；任何功能修复、清理、部署完成前，都必须核对三端 `git rev-parse HEAD` 一致。
- 不能只在本地构建/测试通过就宣称完成；涉及后端、队列、解析、AI、存储、数据库、部署脚本的变更，必须同步到服务器端和 Mac mini Worker 端并完成 smoke test。
- Mac mini Worker 是生产执行端，允许自动执行拉取、重置到远端主分支、安装依赖、构建 API、重启 PM2 Worker、清理运行垃圾。若自动同步失败，必须保留当前已运行版本，不允许重启到构建失败版本。
- 每次部署或巡检必须记录并汇报：本地 commit、服务器 commit、Mac mini commit、Worker 进程状态、最近一次同步时间。
- 如果发现三端代码不一致，优先处理同步问题，再判断业务 bug；不同步环境下的测试结论只能作为线索，不能作为验收依据。

## 清理与运行效率铁律

- 测试脚本、scratch 文件、临时调试脚本、压测脚本、旧版巡检脚本、日志、缓存、`__pycache__`、`.next`、临时构建产物不得长期留在服务器运行目录。
- 正式单元测试和集成测试可以保留在仓库中，但生产部署/Worker 运行目录必须定期执行自动清理，只保留运行必需文件和当前构建产物。
- 任何新建临时脚本必须带有明确用途和清理路径；任务结束后能删除就删除，不能删除必须写入文档说明保留原因。
- 完成部署前必须运行自动清理命令，并确认没有明文密钥、废弃脚本、测试数据清理脚本或无关调试文件残留在 tracked 文件中。

## 本机自动 Agent 铁律

- 自动 review、QA、bug 记忆、项目经理 Agent 只能部署在本机，必须放在 `.local-agents/`、`.agent-memory/` 等被 Git 忽略的路径。
- 这些 Agent 不得写入 `package.json` 的生产脚本、Docker、PM2、服务器部署脚本或 Mac mini Worker 同步脚本。
- 这些 Agent 不得监听端口，不得提供 HTTP 服务；只能通过本机 git hook、文件轮询或手动命令触发。
- 推送代码、服务器同步、Mac mini Worker 自动拉取时必须忽略这些 Agent，不能把它们同步到线上或 Worker 端。
- Agent 产出的 review 报告、QA 报告、bug 记录、任务催办记录默认写入 `.agent-memory/`，只作为本机开发记忆和调试参考。
