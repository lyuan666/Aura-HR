# YZSCHROS 部署标准操作流程 (SOP)

> 最后更新: 2026-05-10
> 事故驱动: 由 5 次生产崩溃事故总结而成
> **每次部署前必读，每步必须执行验证**

---

## 服务器信息

| 项目 | 值 |
|------|-----|
| IP | 47.97.62.57 |
| OS | Alibaba Cloud Linux 3 |
| RAM | 1.8GB + 2GB swap |
| Node.js | v20.20.2 |
| 项目目录 | /opt/yzschros |
| PM2 进程 | yzschros-api (3001), yzschros-web (3000) |

---

## 部署前检查

```bash
# 1. 确认本地构建成功
cd /Users/lee/Desktop/YZSCHROS
pnpm build:api 2>&1 | tail -5
pnpm build:web 2>&1 | tail -5

# 2. 确认构建产物存在
ls -la apps/api/dist/main.js
ls -la apps/web/.next/standalone/apps/web/server.js
```

如果构建失败，**停止**，不要部署。

---

## Web 前端部署

### Step 1: 同步 standalone 构建

```bash
# 从项目根目录执行
rsync -avz apps/web/.next/standalone/ root@47.97.62.57:/opt/yzschros/apps/web/.next/standalone/
```

### Step 2: 同步 static 文件

```bash
rsync -avz apps/web/.next/static/ root@47.97.62.57:/opt/yzschros/apps/web/.next/static/
```

### Step 3: 同步 public 目录

```bash
rsync -avz apps/web/public/ root@47.97.62.57:/opt/yzschros/apps/web/public/
```

### Step 4: 在服务器上复制 static 和 public 到 standalone 内部

```bash
ssh root@47.97.62.57 << 'EOF'
  # 先删除旧目录，防止发生目录嵌套 (static/static)
  rm -rf /opt/yzschros/apps/web/.next/standalone/apps/web/.next/static
  rm -rf /opt/yzschros/apps/web/.next/standalone/apps/web/public

  # 复制 static（Next.js standalone 不包含 static，必须手动复制）
  cp -r /opt/yzschros/apps/web/.next/static /opt/yzschros/apps/web/.next/standalone/apps/web/.next/

  # 复制 public（同上）
  cp -r /opt/yzschros/apps/web/public /opt/yzschros/apps/web/.next/standalone/apps/web/
EOF
```

### Step 5: 重启 Web 进程

```bash
ssh root@47.97.62.57 "pm2 restart yzschros-web"
```

### Step 6: 验证

```bash
# 等待 5 秒
sleep 5

# 检查首页
ssh root@47.97.62.57 "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/"
# 预期: 307 或 200

# 检查静态资源
ssh root@47.97.62.57 "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/_next/static/"
# 预期: 200

# 检查 PM2
ssh root@47.97.62.57 "pm2 list"
# 预期: yzschros-web online, restart 0
```

**如果验证失败**: 不要宣布完成，排查问题。

---

## API 后端部署

### Step 1: 同步 API 代码

```bash
rsync -avz --exclude='node_modules' --exclude='.git' apps/api/ root@47.97.62.57:/opt/yzschros/apps/api/
```

### Step 2: 替换 LLM URL（临时方案，直到改为环境变量驱动）

```bash
ssh root@47.97.62.57 "sed -i \
  -e \"s|deepseekApiUrl = 'https://api.deepseek.com/chat/completions'|deepseekApiUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'|\" \
  -e \"s|deepseekModel = 'deepseek-chat'|deepseekModel = 'qwen-plus'|\" \
  -e \"s|cloudApiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'|cloudApiUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'|\" \
  -e \"s|cloudModel = 'glm-4-flash'|cloudModel = 'qwen-turbo'|\" \
  -e \"s|visionModel = 'glm-4v-flash'|visionModel = 'qwen-vl-plus'|\" \
  /opt/yzschros/apps/api/dist/modules/ai/llm-client.service.js"
```

### Step 3: 在服务器上安装依赖（如果 package.json 有变化）

```bash
ssh root@47.97.62.57 "cd /opt/yzschros && pnpm install --filter @yzschros/api"
```

### Step 4: 重启 API 进程

```bash
ssh root@47.97.62.57 "pm2 restart yzschros-api"
```

### Step 5: 验证

```bash
sleep 5

# 检查 API 响应
ssh root@47.97.62.57 "curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3001/api/auth/login"
# 预期: 400 或 401 (不是 500 或无响应)

# 检查 PM2
ssh root@47.97.62.57 "pm2 list"
# 预期: yzschros-api online, restart 0

# 等 30 秒再检查一次稳定性
sleep 30
ssh root@47.97.62.57 "pm2 list"
# restart 次数应该还是 0
```

---

## 全量部署 (API + Web)

按 API 先、Web 后的顺序执行。每步独立验证。

```bash
# === API ===
rsync -avz --exclude='node_modules' --exclude='.git' apps/api/ root@47.97.62.57:/opt/yzschros/apps/api/
ssh root@47.97.62.57 "sed -i \
  -e \"s|deepseekApiUrl = 'https://api.deepseek.com/chat/completions'|deepseekApiUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'|\" \
  -e \"s|deepseekModel = 'deepseek-chat'|deepseekModel = 'qwen-plus'|\" \
  -e \"s|cloudApiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'|cloudApiUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'|\" \
  -e \"s|cloudModel = 'glm-4-flash'|cloudModel = 'qwen-turbo'|\" \
  -e \"s|visionModel = 'glm-4v-flash'|visionModel = 'qwen-vl-plus'|\" \
  /opt/yzschros/apps/api/dist/modules/ai/llm-client.service.js && pm2 restart yzschros-api"

# 验证 API
sleep 5
ssh root@47.97.62.57 "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/auth/login"

# === Web ===
rsync -avz apps/web/.next/standalone/ root@47.97.62.57:/opt/yzschros/apps/web/.next/standalone/
rsync -avz apps/web/.next/static/ root@47.97.62.57:/opt/yzschros/apps/web/.next/static/
rsync -avz apps/web/public/ root@47.97.62.57:/opt/yzschros/apps/web/public/
ssh root@47.97.62.57 "rm -rf /opt/yzschros/apps/web/.next/standalone/apps/web/.next/static /opt/yzschros/apps/web/.next/standalone/apps/web/public && cp -r /opt/yzschros/apps/web/.next/static /opt/yzschros/apps/web/.next/standalone/apps/web/.next/ && cp -r /opt/yzschros/apps/web/public /opt/yzschros/apps/web/.next/standalone/apps/web/ && pm2 restart yzschros-web"

# 验证 Web
sleep 5
ssh root@47.97.62.57 "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/ && echo '' && curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/_next/static/"
```

---

## 禁止操作清单

| 操作 | 原因 | 替代方案 |
|------|------|----------|
| `rsync --delete` 同步到 web 根目录 | 会删除 standalone 内的 static 和 public | 分别同步 standalone/、static/、public/ |
| 同步整个 `.next/` 目录 | 包含 5GB+ 的 dev/ 和 cache/ | 只同步 standalone/ 子目录 |
| 部署后不验证 | 静默失败导致线上白屏 | 每步执行 curl 验证 |
| 忘记复制 static 到 standalone 内 | Next.js standalone 不含 static，导致 404 | 每次部署执行 cp -r static |
| 忘记 sed 替换 LLM URL | AI 功能失效 | Step 2 不可跳过 |

---

## 事故日志

| # | 日期 | 现象 | 根因 | 修复 |
|---|------|------|------|------|
| 1 | 2026-05-07 | API PostgreSQL 认证失败 | PM2 cwd 指向项目根，.env 相对路径解析错误 | 改 cwd 到 apps/api |
| 2 | 2026-05-07 | rsync 传 5.3GB 10分钟未完 | 同步了整个 .next 包含 dev/ | 排除 dev/ cache/ |
| 3 | 2026-05-07 | server.js 路径嵌套错误 | rsync 路径不匹配 | mv 到正确位置 |
| 4 | 2026-05-10 | 前端全部 JS/CSS 404，白屏 | standalone 不含 static，未手动复制 | cp static 到 standalone 内 |
| 5 | 多次 | AI 功能失效 | dist 覆盖后 LLM URL 变回默认 | sed 替换 URL |
