#!/bin/bash
# setup-mac-mini-all.sh — Mac Mini 全栈一键部署
# 包含: Ollama (本地LLM) + MinerU (PDF解析) + BullMQ Worker
#
# 用法 (在 Mac Mini 终端执行):
#   curl -fsSL https://raw.githubusercontent.com/lyuan666/Aura-HR/main/deploy/setup-mac-mini-all.sh | bash
#
# 或者:
#   git clone https://github.com/lyuan666/Aura-HR.git ~/yzschros
#   cd ~/yzschros && bash deploy/setup-mac-mini-all.sh
#
# 也可在已有代码目录执行:
#   cd /path/to/YZSCHROS && bash deploy/setup-mac-mini-all.sh

set -euo pipefail

# ─── 配置区 ───
REPO_URL="https://github.com/lyuan666/Aura-HR.git"
REPO_DIR="${REPO_DIR:-$HOME/yzschros}"
BRANCH="${BRANCH:-main}"
ECS_TAILSCALE_IP="100.85.253.6"

# Ollama 模型 (可选: qwen2.5:7b, qwen2.5:14b, deepseek-r1:7b)
OLLAMA_MODEL="${OLLAMA_MODEL:-qwen2.5:7b}"

# MinerU Docker
MINERU_IMAGE="${MINERU_IMAGE:-opendatalab/mineru:latest}"
MINERU_PORT="${MINERU_PORT:-8000}"

echo "╔══════════════════════════════════════════════════╗"
echo "║   YZSCHROS Mac Mini 全栈一键部署                ║"
echo "║   Ollama + MinerU + BullMQ Worker              ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ─── 检查 macOS ───
if [[ "$(uname)" != "Darwin" ]]; then
  echo "❌ 此脚本仅支持 macOS"
  exit 1
fi

# ─── Step 1: Tailscale 检查 ───
echo "[1/8] 检查 Tailscale..."
if ! command -v tailscale &>/dev/null; then
  echo "  ⚠️  未安装 Tailscale，正在安装..."
  brew install tailscale 2>/dev/null || {
    echo "  请手动安装 Tailscale: https://tailscale.com/download/mac"
    echo "  安装后重新运行此脚本"
    exit 1
  }
fi

if ! tailscale status &>/dev/null; then
  echo "  ⚠️  Tailscale 未登录"
  echo "  请运行: tailscale up"
  echo "  登录后重新运行此脚本"
  exit 1
fi

# 验证能连到 ECS
ECS_REACHABLE=false
if tailscale status 2>/dev/null | grep -q "$ECS_TAILSCALE_IP"; then
  ECS_REACHABLE=true
  echo "  ✅ Tailscale 已连接，ECS ($ECS_TAILSCALE_IP) 可达"
else
  echo "  ⚠️  未在 Tailscale 网络中找到 ECS ($ECS_TAILSCALE_IP)"
  echo "  确保两台机器在同一 Tailscale 账号下"
  read -p "  继续部署? (y/N) " -n 1 -r
  echo
  [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
fi

# ─── Step 2: Homebrew + 基础工具 ───
echo "[2/8] 检查基础工具..."
if ! command -v brew &>/dev/null; then
  echo "  安装 Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Node.js
if ! command -v node &>/dev/null; then
  echo "  安装 Node.js 20..."
  brew install node@20
  brew link node@20 --overwrite 2>/dev/null || true
fi
echo "  Node.js $(node -v)"

# pnpm + PM2
command -v pnpm &>/dev/null || npm install -g pnpm
command -v pm2 &>/dev/null || npm install -g pm2
echo "  pnpm $(pnpm -v) / PM2 $(pm2 -v)"

# ─── Step 3: Ollama ───
echo "[3/8] 安装 Ollama + 模型 ($OLLAMA_MODEL)..."
if ! command -v ollama &>/dev/null; then
  echo "  安装 Ollama..."
  brew install ollama
fi

# 确保 Ollama 服务在运行
if ! curl -s http://localhost:11434/api/tags &>/dev/null; then
  echo "  启动 Ollama 服务..."
  ollama serve &>/dev/null &
  sleep 3
fi

# 拉取模型
if ! ollama list 2>/dev/null | grep -q "$OLLAMA_MODEL"; then
  echo "  拉取模型 $OLLAMA_MODEL (首次需要下载，约 4-9GB)..."
  ollama pull "$OLLAMA_MODEL"
else
  echo "  模型 $OLLAMA_MODEL 已存在"
fi

# 验证 Ollama
OLLAMA_TEST=$(curl -s http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"$OLLAMA_MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"说OK\"}],\"max_tokens\":10}" 2>/dev/null)
if echo "$OLLAMA_TEST" | grep -q "choices"; then
  echo "  ✅ Ollama + $OLLAMA_MODEL 工作正常"
else
  echo "  ⚠️  Ollama 响应异常，请检查: ollama serve"
fi

# ─── Step 4: MinerU Docker ───
echo "[4/8] 安装 MinerU (PDF 结构化解析)..."
if ! command -v docker &>/dev/null; then
  echo "  安装 Docker Desktop..."
  brew install --cask docker
  echo "  ⚠️  Docker Desktop 已安装，请从 Applications 启动后重新运行此脚本"
  echo "  或者: open /Applications/Docker.app"
  # 不退出，允许用户已有 Docker 但没在 PATH
fi

if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
  echo "  拉取 MinerU 镜像 (约 3GB)..."
  docker pull "$MINERU_IMAGE" 2>/dev/null || echo "  ⚠️  镜像拉取失败，将使用 pdf-parse 降级"

  # 停掉旧的
  docker rm -f mineru 2>/dev/null || true

  # 启动 MinerU
  docker run -d \
    --name mineru \
    --memory=2g \
    -p "$MINERU_PORT:8000" \
    --restart unless-stopped \
    "$MINERU_IMAGE" 2>/dev/null || echo "  ⚠️  MinerU 启动失败，将使用 pdf-parse 降级"

  sleep 3
  if docker ps | grep -q mineru; then
    echo "  ✅ MinerU 运行中 (port $MINERU_PORT)"
  else
    echo "  ⚠️  MinerU 未运行，简历解析将使用 pdf-parse 降级方案"
  fi
else
  echo "  ⚠️  Docker 未运行，跳过 MinerU (使用 pdf-parse 降级)"
  echo "  启动 Docker 后执行: docker run -d --name mineru --memory=2g -p 8000:8000 --restart unless-stopped opendatalab/mineru:latest"
fi

# ─── Step 5: 获取代码 ───
echo "[5/8] 获取代码..."
if [ ! -d "$REPO_DIR" ]; then
  git clone "$REPO_URL" "$REPO_DIR" --branch "$BRANCH" --depth 1
else
  cd "$REPO_DIR"
  git fetch origin --depth 1
  git checkout "$BRANCH"
  git reset --hard "origin/$BRANCH"
fi
cd "$REPO_DIR"

# ─── Step 6: 安装依赖 + 构建 ───
echo "[6/8] 安装依赖 + 构建 API..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
pnpm build:api

# ─── Step 7: 生成配置 ───
echo "[7/8] 生成配置..."

MINERU_URL="http://localhost:$MINERU_PORT"
if ! docker ps 2>/dev/null | grep -q mineru; then
  MINERU_URL=""
fi

cat > "$REPO_DIR/.env.worker" << EOF
# === YZSCHROS Mac Mini Worker ===
# 生成时间: $(date)
# 主机: $(hostname)

# ─── Worker 模式 ───
WORKER_ONLY=true
NODE_ENV=production

# ─── Redis (ECS via Tailscale) ───
REDIS_URL=redis://${ECS_TAILSCALE_IP}:6379

# ─── PostgreSQL (ECS via Tailscale) ───
DATABASE_HOST=${ECS_TAILSCALE_IP}
DATABASE_PORT=5432
DATABASE_USER=yzschros
DATABASE_PASSWORD=yzschros_prod_2026
DATABASE_NAME=yzschros

# ─── MinIO (ECS via Tailscale) ───
MINIO_ENDPOINT=${ECS_TAILSCALE_IP}
MINIO_PORT=9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin_prod_2026
MINIO_USE_SSL=false

# ─── LLM: Ollama 本地 (主) + 百炼云端 (备) ───
LLM_RESUME_URL=http://localhost:11434/v1/chat/completions
LLM_RESUME_MODEL=${OLLAMA_MODEL}
LLM_RESUME_KEY=ollama

# 百炼云端 fallback (ECS 可达外网时)
LLM_RESUME_FALLBACK_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
LLM_RESUME_FALLBACK_MODEL=qwen-plus
LLM_RESUME_FALLBACK_KEY=sk-af9c9213add54fa5b0f6d77dc67af3c8

# 全局 LLM 并发 (Mac Mini 性能好，可以 3 并发)
LLM_CONCURRENCY=3

# ─── MinerU PDF 解析 (本地 Docker) ───
MINERU_URL=${MINERU_URL}

# ─── 向量化 (暂用百炼) ───
ZHIPU_API_KEY=sk-af9c9213add54fa5b0f6d77dc67af3c8
ZHIPU_EMBEDDING_MODEL=embedding-3

# ─── 本地 AI (兼容旧代码路径) ───
LOCAL_AI_ENABLED=false
EOF

chmod 600 "$REPO_DIR/.env.worker"

# PM2 ecosystem
cat > "$REPO_DIR/ecosystem.worker.config.js" << 'CONF'
module.exports = {
  apps: [{
    name: 'yzschros-worker',
    script: 'apps/api/dist/main.js',
    env_file: '.env.worker',
    node_args: '--max-old-space-size=1024',
    max_memory_restart: '1200M',
    max_restarts: 10,
    restart_delay: 5000,
    watch: false,
    autorestart: true,
  }],
};
CONF

echo "  ✅ 配置完成"

# ─── Step 8: 启动 Worker ───
echo "[8/8] 启动 Worker..."
cd "$REPO_DIR"
pm2 delete yzschros-worker 2>/dev/null || true
pm2 start ecosystem.worker.config.js
pm2 save
pm2 startup 2>/dev/null || echo "  提示: 手动运行 'pm2 startup' 配置开机自启"

# ─── 完成 ───
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   ✅ 部署完成!                                  ║"
echo "╠══════════════════════════════════════════════════╣"

pm2 status

echo ""
echo "── 服务状态 ──"
echo "Ollama:  $(curl -s http://localhost:11434/api/tags >/dev/null 2>&1 && echo '✅ 运行中' || echo '❌ 未响应')"
echo "MinerU:  $(curl -s http://localhost:$MINERU_PORT/health >/dev/null 2>&1 && echo '✅ 运行中' || echo '⚠️ 未响应 (使用 pdf-parse 降级)')"
echo "Worker:  $(pm2 pid yzschros-worker 2>/dev/null | grep -q '[0-9]' && echo '✅ 运行中' || echo '❌ 未启动')"
echo ""
echo "── 日常命令 ──"
echo "日志:   pm2 logs yzschros-worker"
echo "重启:   pm2 restart yzschros-worker"
echo "状态:   pm2 status"
echo "更新:   cd $REPO_DIR && git pull && pnpm build:api && pm2 restart yzschros-worker"
echo ""
echo "── Ollama 管理 ──"
echo "查看模型:  ollama list"
echo "换模型:    ollama pull qwen2.5:14b"
echo "           然后编辑 $REPO_DIR/.env.worker 修改 LLM_RESUME_MODEL"
echo "测试:      curl http://localhost:11434/v1/chat/completions -d '{\"model\":\"$OLLAMA_MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"你好\"}]}'"
echo ""
echo "── MinerU 管理 ──"
echo "重启:  docker restart mineru"
echo "日志:  docker logs mineru -f"
echo ""
echo "── 架构说明 ──"
echo "ECS (47.97.62.57)  →  API + Web + PostgreSQL + Redis + MinIO"
echo "Mac Mini (Worker)  →  Ollama + MinerU + BullMQ Processor"
echo "连接: Tailscale VPN (${ECS_TAILSCALE_IP})"
