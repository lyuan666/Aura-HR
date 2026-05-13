#!/bin/bash
set -euo pipefail

ECS="100.85.253.6"
DIR="$HOME/yzschros"

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
required_env ZHIPU_API_KEY

echo ">>> 1/6 代码"
[ -d "$DIR" ] || git clone https://github.com/lyuan666/Aura-HR.git "$DIR" --depth 1
cd "$DIR" && git pull 2>/dev/null || true

echo ">>> 2/6 工具"
command -v pnpm &>/dev/null || npm i -g pnpm
command -v pm2 &>/dev/null || npm i -g pm2

echo ">>> 3/6 Ollama"
command -v ollama &>/dev/null || brew install ollama
curl -s http://localhost:11434/api/tags &>/dev/null || { ollama serve &>/dev/null & sleep 3; }
ollama list 2>/dev/null | grep -q "qwen2.5" || ollama pull qwen2.5:7b

echo ">>> 4/6 构建"
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
pnpm build:api

echo ">>> 5/6 配置"
cat > .env.worker << EOF
WORKER_ONLY=true
NODE_ENV=production
REDIS_URL=redis://${ECS}:6379
DATABASE_HOST=${ECS}
DATABASE_PORT=5432
DATABASE_USER=yzschros
DATABASE_PASSWORD=${DATABASE_PASSWORD}
DATABASE_NAME=yzschros
MINIO_ENDPOINT=${ECS}
MINIO_PORT=9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
MINIO_USE_SSL=false
LLM_RESUME_URL=http://localhost:11434/v1/chat/completions
LLM_RESUME_MODEL=qwen2.5:7b
LLM_RESUME_KEY=ollama
LLM_RESUME_FALLBACK_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
LLM_RESUME_FALLBACK_MODEL=qwen-plus
LLM_RESUME_FALLBACK_KEY=${LLM_RESUME_FALLBACK_KEY}
LLM_CONCURRENCY=3
ZHIPU_API_KEY=${ZHIPU_API_KEY}
ZHIPU_EMBEDDING_MODEL=embedding-3
LOCAL_AI_ENABLED=false
EOF

echo ">>> 6/6 启动"
cat > ecosystem.worker.config.js << 'ECO'
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
    node_args: '--max-old-space-size=1024',
    max_memory_restart: '1200M',
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
  }],
};
ECO
pm2 delete yzschros-worker 2>/dev/null || true
pm2 start ecosystem.worker.config.js
pm2 save
pm2 startup 2>/dev/null || true

chmod +x "$DIR/deploy/macmini-worker-sync.sh" "$DIR/scripts/clean-runtime-artifacts.sh"
mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs/yzschros"
PLIST="$HOME/Library/LaunchAgents/com.yzschros.worker.sync.plist"
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
    <string>$DIR/deploy/macmini-worker-sync.sh</string>
  </array>
  <key>StartInterval</key>
  <integer>120</integer>
  <key>RunAtLoad</key>
  <true/>
  <key>WorkingDirectory</key>
  <string>$DIR</string>
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

pm2 status
echo "完成! 日志: pm2 logs yzschros-worker"
echo "自动同步日志: tail -f $HOME/Library/Logs/yzschros/macmini-worker-sync.log"
