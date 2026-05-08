#!/bin/bash
# setup-mac-mini-worker.sh — Mac Mini 一键部署 YZSCHROS Worker
#
# 用法:
#   bash <(curl -fsSL https://raw.githubusercontent.com/lyuan666/Aura-HR/main/deploy/setup-mac-mini-worker.sh)
#
# 或者先 clone 再运行:
#   git clone https://github.com/lyuan666/Aura-HR.git ~/yzschros
#   cd ~/yzschros && bash deploy/setup-mac-mini-worker.sh

set -euo pipefail

REPO_URL="https://github.com/lyuan666/Aura-HR.git"
REPO_DIR="${REPO_DIR:-$HOME/yzschros}"
BRANCH="${BRANCH:-main}"
ECS_IP="100.85.253.6"

echo "=== YZSCHROS Mac Mini Worker 一键部署 ==="
echo ""

# ──────────────────────────────────────────────
# Step 1: 检查 Node.js
# ──────────────────────────────────────────────
echo "[1/6] 检查 Node.js..."
if ! command -v node &>/dev/null; then
  echo "  安装 Node.js 20..."
  if ! command -v nvm &>/dev/null; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  fi
  nvm install 20
  nvm use 20
fi
echo "  Node.js $(node -v)"

# ──────────────────────────────────────────────
# Step 2: 安装 pnpm + PM2
# ──────────────────────────────────────────────
echo "[2/6] 安装 pnpm + PM2..."
command -v pnpm &>/dev/null || npm install -g pnpm
command -v pm2 &>/dev/null || npm install -g pm2
echo "  pnpm $(pnpm -v) / PM2 $(pm2 -v)"

# ──────────────────────────────────────────────
# Step 3: 克隆代码
# ──────────────────────────────────────────────
echo "[3/6] 获取代码..."
if [ ! -d "$REPO_DIR" ]; then
  git clone "$REPO_URL" "$REPO_DIR" --branch "$BRANCH"
else
  cd "$REPO_DIR"
  git fetch origin
  git checkout "$BRANCH"
  git reset --hard "origin/$BRANCH"
fi

cd "$REPO_DIR"

# ──────────────────────────────────────────────
# Step 4: 安装依赖 + 构建
# ──────────────────────────────────────────────
echo "[4/6] 安装依赖 + 构建 API..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
pnpm build:api

# ──────────────────────────────────────────────
# Step 5: 创建配置
# ──────────────────────────────────────────────
echo "[5/6] 创建 .env.worker..."

cat > "$REPO_DIR/.env.worker" << EOF
# === YZSCHROS Worker ===
# 生成时间: $(date)

# Worker 模式: 不启动 HTTP
WORKER_ONLY=true

# Redis (via Tailscale)
REDIS_URL=redis://${ECS_IP}:6379

# PostgreSQL (via Tailscale)
DATABASE_HOST=${ECS_IP}
DATABASE_PORT=5432
DATABASE_USER=yzschros
DATABASE_PASSWORD=yzschros_prod_2026
DATABASE_NAME=yzschros

# MinIO (via Tailscale)
MINIO_ENDPOINT=${ECS_IP}
MINIO_PORT=9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin_prod_2026
MINIO_USE_SSL=false

# LLM (本地调用)
LLM_RESUME_URL=https://api.deepseek.com/chat/completions
LLM_RESUME_MODEL=deepseek-chat
LLM_RESUME_KEY=sk-9b7db7ebeca54ec080ccb66db30369f7
LLM_RESUME_FALLBACK_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
LLM_RESUME_FALLBACK_MODEL=glm-4-flash
LLM_RESUME_FALLBACK_KEY=9f1925f431c44aaab72caf2fd427966f.My5sSrunPXET0jTX

NODE_ENV=production
MINERU_URL=
EOF

chmod 600 "$REPO_DIR/.env.worker"

# PM2 ecosystem
cat > "$REPO_DIR/ecosystem.worker.config.js" << 'CONF'
module.exports = {
  apps: [{
    name: 'yzschros-worker',
    script: 'apps/api/dist/main.js',
    env_file: '.env.worker',
    node_args: '--max-old-space-size=512',
    max_memory_restart: '600M',
    max_restarts: 10,
    restart_delay: 5000,
    watch: false,
    autorestart: true,
  }],
};
CONF

echo "  配置完成"

# ──────────────────────────────────────────────
# Step 6: 启动 Worker
# ──────────────────────────────────────────────
echo "[6/6] 启动 Worker..."
pm2 delete yzschros-worker 2>/dev/null || true
pm2 start ecosystem.worker.config.js
pm2 save
pm2 startup 2>/dev/null || echo "  手动运行 'pm2 startup' 配置开机自启"

echo ""
echo "=== 部署完成 ==="
echo ""
pm2 status
echo ""
echo "日志: pm2 logs yzschros-worker"
echo "重启: pm2 restart yzschros-worker"
echo "更新: cd $REPO_DIR && git pull && pnpm build:api && pm2 restart yzschros-worker"
