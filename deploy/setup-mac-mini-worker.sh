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

required_env() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    echo "缺少必填环境变量: $name"
    echo "示例: export $name='your-secret-value'"
    exit 1
  fi
}

required_env DATABASE_PASSWORD
required_env MINIO_ROOT_PASSWORD
required_env LLM_RESUME_FALLBACK_KEY

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
# Step 2: 安装 pnpm + PM2 + Ollama
# ──────────────────────────────────────────────
echo "[2/6] 安装 pnpm + PM2 + Ollama..."
command -v pnpm &>/dev/null || npm install -g pnpm
command -v pm2 &>/dev/null || npm install -g pm2
if ! command -v ollama &>/dev/null; then
  if command -v brew &>/dev/null; then
    brew install ollama
  else
    echo "缺少 Ollama；请先安装 Ollama 或 Homebrew 后重试"
    exit 1
  fi
fi
curl -s http://localhost:11434/api/tags &>/dev/null || { ollama serve &>/dev/null & sleep 3; }
ollama list 2>/dev/null | grep -q "qwen2.5:7b" || ollama pull qwen2.5:7b
echo "  pnpm $(pnpm -v) / PM2 $(pm2 -v) / Ollama $(ollama --version 2>/dev/null | head -1)"

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
DATABASE_PASSWORD=${DATABASE_PASSWORD}
DATABASE_NAME=yzschros

# MinIO (via Tailscale)
MINIO_ENDPOINT=${ECS_IP}
MINIO_PORT=9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
MINIO_USE_SSL=false

# LLM (Mac mini 本地优先，云端兜底)
LLM_RESUME_URL=http://localhost:11434/v1/chat/completions
LLM_RESUME_MODEL=qwen2.5:7b
LLM_RESUME_KEY=ollama
LLM_RESUME_FALLBACK_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
LLM_RESUME_FALLBACK_MODEL=qwen-plus
LLM_RESUME_FALLBACK_KEY=${LLM_RESUME_FALLBACK_KEY}
LLM_CONCURRENCY=1

LOCAL_AI_ENABLED=true
LOCAL_AI_URL=http://localhost:11434/v1/chat/completions
LOCAL_AI_KEY=ollama
LOCAL_AI_MODEL=qwen2.5:7b

NODE_ENV=production
MINERU_URL=
EOF

chmod 600 "$REPO_DIR/.env.worker"

# PM2 ecosystem
cat > "$REPO_DIR/ecosystem.worker.config.js" << 'CONF'
const fs = require('fs');
const path = require('path');

function loadEnvFile(file) {
  const envPath = path.resolve(__dirname, file);
  const env = {};

  if (!fs.existsSync(envPath)) {
    return env;
  }

  for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const equalsIndex = line.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

module.exports = {
  apps: [{
    name: 'yzschros-worker',
    script: 'apps/api/dist/main.js',
    env: loadEnvFile('.env.worker'),
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
echo "[6/6] 启动 Worker + 注册自动同步..."
pm2 delete yzschros-worker 2>/dev/null || true
pm2 start ecosystem.worker.config.js
pm2 save
pm2 startup 2>/dev/null || echo "  手动运行 'pm2 startup' 配置开机自启"

chmod +x "$REPO_DIR/deploy/macmini-worker-sync.sh" "$REPO_DIR/scripts/clean-runtime-artifacts.sh"

LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST="$LAUNCH_AGENTS_DIR/com.yzschros.worker.sync.plist"
mkdir -p "$LAUNCH_AGENTS_DIR" "$HOME/Library/Logs/yzschros"

cat > "$PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.yzschros.worker.sync</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$REPO_DIR/deploy/macmini-worker-sync.sh</string>
  </array>
  <key>StartInterval</key>
  <integer>120</integer>
  <key>RunAtLoad</key>
  <true/>
  <key>WorkingDirectory</key>
  <string>$REPO_DIR</string>
  <key>StandardOutPath</key>
  <string>$HOME/Library/Logs/yzschros/macmini-worker-sync.launchd.out.log</string>
  <key>StandardErrorPath</key>
  <string>$HOME/Library/Logs/yzschros/macmini-worker-sync.launchd.err.log</string>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
launchctl kickstart -k "gui/$(id -u)/com.yzschros.worker.sync"

echo ""
echo "=== 部署完成 ==="
echo ""
pm2 status
echo ""
echo "日志: pm2 logs yzschros-worker"
echo "重启: pm2 restart yzschros-worker"
echo "自动同步日志: tail -f $HOME/Library/Logs/yzschros/macmini-worker-sync.log"
echo "更新: cd $REPO_DIR && git pull && pnpm build:api && pm2 restart yzschros-worker"
