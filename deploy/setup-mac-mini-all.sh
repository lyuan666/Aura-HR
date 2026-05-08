#!/bin/bash
set -euo pipefail

ECS="100.85.253.6"
DIR="$HOME/yzschros"

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
DATABASE_PASSWORD=yzschros_prod_2026
DATABASE_NAME=yzschros
MINIO_ENDPOINT=${ECS}
MINIO_PORT=9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin_prod_2026
MINIO_USE_SSL=false
LLM_RESUME_URL=http://localhost:11434/v1/chat/completions
LLM_RESUME_MODEL=qwen2.5:7b
LLM_RESUME_KEY=ollama
LLM_RESUME_FALLBACK_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
LLM_RESUME_FALLBACK_MODEL=qwen-plus
LLM_RESUME_FALLBACK_KEY=sk-af9c9213add54fa5b0f6d77dc67af3c8
LLM_CONCURRENCY=3
ZHIPU_API_KEY=sk-af9c9213add54fa5b0f6d77dc67af3c8
ZHIPU_EMBEDDING_MODEL=embedding-3
LOCAL_AI_ENABLED=false
EOF

echo ">>> 6/6 启动"
cat > ecosystem.worker.config.js << 'ECO'
module.exports = {
  apps: [{
    name: 'yzschros-worker',
    script: 'apps/api/dist/main.js',
    env_file: '.env.worker',
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
pm2 status
echo "完成! 日志: pm2 logs yzschros-worker"
