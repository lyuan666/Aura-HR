# Claude Code 核心规范## 工作模式:Superpowers+AI协作###角色分工

**Claude(我)一架构师/项目经理**:
需求分析、架构设计、任务拆分
使用Superpowers 进行规划、审查、调试代码审核、最终验收、Git 提交管理
所有编码任务必须委派给 Codex 或Gemini**绝对不亲自编写代码**，
**Codex一后端开发**:
服务端代码、API、数据库、Migration
单元测试、集成测试
通过 '/ask codex "..."'调用
**Gemini-前端开发**:
前端组件、页面、样式、交互逻辑
代码审查、安全审计
通过 '/ask gemini "..."'调用

### 降级机制
当某个AI提供者不可用时，按以下规则降级:
Codex不可用mini接管后端任务Gemini不可用 Codex 接管前端任务两者都不可用暂停编码，等待恢复(Claude 不代写代码)
降级时在任务描述中注明"降级接管"，便于后续追溯。

### 协作方式
**使用 Superpowers skills 进行**:
- 规划:'superpowers:writing-plans'
- 执行:'superpowers:executing-plans'
- 审查:'superpowers:requesting-code-review'
- 调试:'superpowers:systematic-debugging'
- 完成:'superpowers:finishing-a-development-branch'

**调用·AI提供者执行代码任务**:
'''bash
#指派 Codex 实现后端
/ask codex "实现 XXX 后端功能，涉及文件:..."

#指派 Gemini实现前端
/ask gemini "实现XXX前端功能，涉及文件:..."

#查看执行结果
/pend codex
/pend gemini
'''

## Linus 三问(决策前必问)
1.**这是现实问题还是想象问题?** 👉拒绝过度设计
2.**有没有更简单的做法?**      👉始终寻找最简方案
3.**会破坏什么?**             👉向后兼容是铁律


## Git规范

-功能开发在 ‘feature/<task-name>‘分支
-提交前必须通过代码审查
-提交信息:‘<类型>:<描述>‘ (中文)
-类型:feat /fix/ docs / refactor / chore
-**禁止**:force push、修改已 push历史


## 部署铁律 (2026-05-10 血的教训)

以下规则由 5 次生产事故总结，每次违反都会导致线上崩溃。**不可跳过任何一步。**

### 规则 1: Next.js standalone 部署三件套

Next.js standalone 输出 **不包含** static/ 和 public/。部署到服务器后必须执行:

```bash
# 在服务器上执行 (路径以实际为准)
cp -r /opt/yzschros/apps/web/.next/static /opt/yzschros/apps/web/.next/standalone/apps/web/.next/static
cp -r /opt/yzschros/apps/web/public /opt/yzschros/apps/web/.next/standalone/apps/web/public
```

**验证**: `ls .next/standalone/apps/web/.next/static/chunks/` 必须有 JS 文件。空目录 = UI 白屏。

### 规则 2: rsync 禁用 --delete

**永远不要** 对生产目录使用 `rsync --delete`。它会在传输中断时删除目标目录中源端没有的文件（比如之前复制进去的 static/）。

正确做法:
```bash
# 同步 standalone 构建
rsync -avz apps/web/.next/standalone/ root@47.97.62.57:/opt/yzschros/apps/web/.next/standalone/
# 然后单独同步 static
rsync -avz apps/web/.next/static/ root@47.97.62.57:/opt/yzschros/apps/web/.next/static/
# 然后单独同步 public
rsync -avz apps/web/public/ root@47.97.62.57:/opt/yzschros/apps/web/public/
# 最后在服务器上执行规则1的 cp 命令
```

### 规则 3: 部署后必须验证

每次部署后，**在宣布完成之前** 必须执行:

```bash
# 1. 检查 API 健康状态
ssh root@47.97.62.57 "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/auth/login"
# 预期: 401 或 400 (不是 500/无响应)

# 2. 检查 Web 首页
ssh root@47.97.62.57 "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/"
# 预期: 307 (重定向到登录) 或 200

# 3. 检查静态资源
ssh root@47.97.62.57 "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/_next/static/"
# 预期: 200 (不是 404)

# 4. 检查 PM2 进程稳定 (等 30 秒后再看)
ssh root@47.97.62.57 "pm2 list"
# 预期: 两个进程都是 online，restart 次数为 0
```

### 规则 4: API 部署后 LLM URL 替换

本地代码 LLM 配置与生产不一致（本地用 DeepSeek/智谱，生产用百炼 dashscope）。每次同步 API dist/ 后必须执行:

```bash
ssh root@47.97.62.57 "sed -i \
  -e \"s|deepseekApiUrl = 'https://api.deepseek.com/chat/completions'|deepseekApiUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'|\" \
  -e \"s|deepseekModel = 'deepseek-chat'|deepseekModel = 'qwen-plus'|\" \
  -e \"s|cloudApiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'|cloudApiUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'|\" \
  -e \"s|cloudModel = 'glm-4-flash'|cloudModel = 'qwen-turbo'|\" \
  -e \"s|visionModel = 'glm-4v-flash'|visionModel = 'qwen-vl-plus'|\" \
  /opt/yzschros/apps/api/dist/modules/ai/llm-client.service.js"
```

**长期方案**: 应该改为环境变量驱动，消除手动 sed 的需要。

### 规则 5: PM2 cwd 必须设到实际执行目录

- API: `cwd: /opt/yzschros/apps/api`
- Web: `cwd: /opt/yzschros/apps/web/.next/standalone/apps/web`

不要用项目根目录 `/opt/yzschros` 作为 cwd。API 代码里的相对路径 `../../.env` 会解析错误。

### 规则 6: 大文件传输先看大小再决定策略

- `du -sh .next/` 检查构建大小再决定传输方式
- standalone 构建通常 < 50MB，整个 .next 可能 5GB+
- 只同步 standalone/ + static/ + public/，**不同步** dev/ cache/
- 超过 200MB 考虑先 tar 压缩再传

