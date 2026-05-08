#!/bin/bash
# setup-ecs-tailscale.sh — 在阿里云 ECS 上运行
# 为 Mac Mini Worker 配置 Tailscale 网络访问
set -euo pipefail

echo "=== ECS Tailscale Setup for Mac Mini Worker ==="

# Step 1: 安装 Tailscale
if ! command -v tailscale &>/dev/null; then
  echo "[1/5] Installing Tailscale..."
  curl -fsSL https://tailscale.com/install.sh | sh
else
  echo "[1/5] Tailscale already installed"
fi

# Step 2: 启动 Tailscale
echo "[2/5] Starting Tailscale..."
if ! tailscale status &>/dev/null; then
  echo "  请在浏览器中完成 Tailscale 登录..."
  tailscale up
else
  echo "  Tailscale already running"
fi

TAILSCALE_IP=$(tailscale ip -4 2>/dev/null || echo "")
if [ -z "$TAILSCALE_IP" ]; then
  echo "ERROR: Could not get Tailscale IP. Run 'tailscale up' first."
  exit 1
fi
echo "  Tailscale IP: $TAILSCALE_IP"

# Step 3: 防火墙 — 允许 Tailscale 接口访问 PG/Redis/MinIO
echo "[3/5] Configuring firewall for Tailscale..."
# 检查 tailscale0 接口是否存在
if ! ip link show tailscale0 &>/dev/null; then
  echo "  WARNING: tailscale0 interface not found. Rules may not take effect."
fi

# PostgreSQL
iptables -C INPUT -i tailscale0 -p tcp --dport 5432 -j ACCEPT 2>/dev/null || \
  iptables -A INPUT -i tailscale0 -p tcp --dport 5432 -j ACCEPT

# Redis
iptables -C INPUT -i tailscale0 -p tcp --dport 6379 -j ACCEPT 2>/dev/null || \
  iptables -A INPUT -i tailscale0 -p tcp --dport 6379 -j ACCEPT

# MinIO API
iptables -C INPUT -i tailscale0 -p tcp --dport 9000 -j ACCEPT 2>/dev/null || \
  iptables -A INPUT -i tailscale0 -p tcp --dport 9000 -j ACCEPT

# MinIO Console (可选)
iptables -C INPUT -i tailscale0 -p tcp --dport 9001 -j ACCEPT 2>/dev/null || \
  iptables -A INPUT -i tailscale0 -p tcp --dport 9001 -j ACCEPT

echo "  Firewall rules added"

# Step 4: PostgreSQL pg_hba.conf — 允许 Tailscale 网段
echo "[4/5] Configuring PostgreSQL for Tailscale access..."
PG_HBA=$(find /www/server -name pg_hba.conf 2>/dev/null | head -1)
if [ -z "$PG_HBA" ]; then
  # Docker PG
  PG_HBA="/tmp/pg_hba.conf"
  echo "  WARNING: pg_hba.conf not found. If using Docker PG, configure manually."
fi

if [ -n "$PG_HBA" ] && [ -f "$PG_HBA" ]; then
  if ! grep -q "100\.64\.0\.0" "$PG_HBA" 2>/dev/null; then
    echo "host    yzschros    yzschros    100.64.0.0/10    md5" >> "$PG_HBA"
    echo "  Added Tailscale subnet to pg_hba.conf"
    # Reload PG
    if command -v systemctl &>/dev/null; then
      systemctl reload postgresql-13 2>/dev/null || systemctl reload postgresql 2>/dev/null || echo "  Please reload PostgreSQL manually"
    fi
  else
    echo "  pg_hba.conf already configured"
  fi
fi

# Step 5: Redis — 确保绑定到 0.0.0.0 或 Tailscale 接口
echo "[5/5] Checking Redis bind configuration..."
REDIS_CONF=$(find /etc /www/server -name "redis.conf" 2>/dev/null | head -1)
if [ -n "$REDIS_CONF" ] && [ -f "$REDIS_CONF" ]; then
  BIND_LINE=$(grep "^bind " "$REDIS_CONF" 2>/dev/null | head -1)
  if echo "$BIND_LINE" | grep -q "127\.0\.0\.1" && ! echo "$BIND_LINE" | grep -q "0\.0\.0\.0"; then
    echo "  WARNING: Redis is bound to 127.0.0.1 only."
    echo "  For Tailscale access, add Tailscale IP to bind line in $REDIS_CONF"
    echo "  Example: bind 127.0.0.1 $TAILSCALE_IP"
    echo "  Then: systemctl restart redis"
  else
    echo "  Redis bind config looks OK"
  fi
fi

echo ""
echo "=== Setup Complete ==="
echo "ECS Tailscale IP: $TAILSCALE_IP"
echo ""
echo "Next: Run setup-mac-mini-worker.sh on your Mac Mini"
echo "  with ECS_TAILSCALE_IP=$TAILSCALE_IP"
