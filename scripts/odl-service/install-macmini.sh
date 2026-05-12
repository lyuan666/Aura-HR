#!/bin/bash
# =============================================================================
# YZSCHROS — Mac Mini 一键部署 OpenDataLoader PDF 提取服务
#
# 使用方法:
#   bash scripts/odl-service/install-macmini.sh
#
# 前置条件:
#   - macOS (Apple Silicon 或 Intel)
#   - Homebrew 已安装
#   - 网络正常 (需下载 ~50MB 依赖)
#
# 安装内容:
#   1. OpenJDK (Java 运行时, opendataloader-pdf 依赖)
#   2. Python venv + opendataloader-pdf + FastAPI
#   3. PM2 服务注册 + 开机自启
#
# 部署后验证:
#   curl http://localhost:8900/health
#   预期: {"status":"ok","engine":"opendataloader-pdf"}
# =============================================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
VENV_DIR="$PROJECT_DIR/.venv-odl"
SERVICE_DIR="$PROJECT_DIR/scripts/odl-service"

echo "============================================"
echo "  YZSCHROS ODL PDF 服务 — Mac Mini 部署"
echo "============================================"
echo "项目目录: $PROJECT_DIR"
echo "venv:     $VENV_DIR"
echo ""

# ── Step 1: Java ─────────────────────────────────────────────────────────────
info "Step 1/5: 检查 Java 运行时"

if java -version &>/dev/null; then
    info "Java 已安装: $(java -version 2>&1 | head -1)"
else
    warn "Java 未安装，正在安装 OpenJDK..."
    if ! command -v brew &>/dev/null; then
        error "Homebrew 未安装。请先运行: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    fi
    brew install openjdk

    # 设置 JAVA_HOME
    export JAVA_HOME="/opt/homebrew/opt/openjdk"
    export PATH="$JAVA_HOME/bin:$PATH"

    if java -version &>/dev/null; then
        info "Java 安装成功: $(java -version 2>&1 | head -1)"
    else
        error "Java 安装失败。请手动运行: brew install openjdk"
    fi
fi

# 确保 JAVA_HOME 设置
JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk}"
export JAVA_HOME
export PATH="$JAVA_HOME/bin:$PATH"

# ── Step 2: Python venv ─────────────────────────────────────────────────────
info "Step 2/5: 创建 Python 虚拟环境"

if [ -d "$VENV_DIR" ] && [ -f "$VENV_DIR/bin/python3" ]; then
    info "venv 已存在: $VENV_DIR"
else
    python3 -m venv "$VENV_DIR"
    info "venv 创建完成"
fi

# ── Step 3: 安装 Python 依赖 ────────────────────────────────────────────────
info "Step 3/5: 安装 Python 依赖 (opendataloader-pdf, fastapi, uvicorn)"

source "$VENV_DIR/bin/activate"

# 处理 SSL 证书问题 (macOS 常见)
PIP_TRUSTED="--trusted-host pypi.org --trusted-host files.pythonhosted.org"

pip install $PIP_TRUSTED \
    opendataloader-pdf==2.4.3 \
    fastapi \
    "uvicorn[standard]" \
    python-multipart \
    2>&1 | tail -5

# 验证
python3 -c "from opendataloader_pdf import convert; print('opendataloader-pdf OK')" || error "opendataloader-pdf 安装失败"
python3 -c "import fastapi; print('fastapi OK')" || error "fastapi 安装失败"

# ── Step 4: 快速验证 ────────────────────────────────────────────────────────
info "Step 4/5: 验证 ODL 提取功能"

# 找一个测试 PDF
TEST_PDF=$(find "$HOME/Downloads" -name "*.pdf" -maxdepth 1 2>/dev/null | head -1)
if [ -n "$TEST_PDF" ]; then
    info "使用测试文件: $(basename "$TEST_PDF")"
    python3 -c "
import time
from opendataloader_pdf import convert
import tempfile, os, shutil

pdf = '$TEST_PDF'
tmp = tempfile.mkdtemp()
out = os.path.join(tmp, 'out')
os.makedirs(out)

start = time.time()
convert(input_path=pdf, output_dir=out, format='markdown', quiet=True)
elapsed = time.time() - start

md_files = [f for f in os.listdir(out) if f.endswith('.md')]
if md_files:
    content = open(os.path.join(out, md_files[0])).read()
    print(f'  提取 {len(content)} 字符，耗时 {elapsed:.2f}s')
else:
    print(f'  警告: 未生成 Markdown 文件 (耗时 {elapsed:.2f}s)')

shutil.rmtree(tmp)
" || warn "验证失败（不影响安装，服务启动后可重新测试）"
else
    warn "Downloads 目录无 PDF 文件，跳过提取验证"
fi

# ── Step 5: PM2 服务注册 ────────────────────────────────────────────────────
info "Step 5/5: 注册 PM2 服务"

if ! command -v pm2 &>/dev/null; then
    warn "PM2 未安装，正在安装..."
    npm install -g pm2
fi

# 创建 PM2 配置（覆盖 interpreter 为 venv python）
cat > "$SERVICE_DIR/pm2.local.js" << PM2EOF
module.exports = {
  apps: [{
    name: "odl-pdf-service",
    script: "$SERVICE_DIR/app.py",
    interpreter: "$VENV_DIR/bin/python3",
    env: {
      ODL_PORT: "8900",
      JAVA_HOME: "$JAVA_HOME",
      PATH: "$JAVA_HOME/bin:/usr/local/bin:/usr/bin:/bin",
    },
    max_memory_restart: "500M",
    max_restarts: 10,
    restart_delay: 5000,
    error_file: "/tmp/odl-pdf-error.log",
    out_file: "/tmp/odl-pdf-out.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss",
  }],
};
PM2EOF

# 停止旧实例（如果有）
pm2 delete odl-pdf-service 2>/dev/null || true

# 启动
pm2 start "$SERVICE_DIR/pm2.local.js"
pm2 save

info "等待服务启动..."
sleep 3

# 最终验证
HEALTH=$(curl -s http://localhost:8900/health 2>/dev/null || echo "FAILED")
if echo "$HEALTH" | grep -q '"ok"'; then
    echo ""
    echo -e "${GREEN}============================================"
    echo "  部署成功!"
    echo -e "============================================${NC}"
    echo ""
    echo "  服务地址: http://localhost:8900"
    echo "  健康检查: curl http://localhost:8900/health"
    echo "  查看日志: pm2 logs odl-pdf-service"
    echo "  重启服务: pm2 restart odl-pdf-service"
    echo "  停止服务: pm2 stop odl-pdf-service"
    echo ""
    echo -e "${YELLOW}下一步: 在 API Worker 的 .env 中添加:${NC}"
    echo "  ODL_URL=http://localhost:8900"
    echo ""
else
    echo ""
    error "服务启动失败。检查日志: pm2 logs odl-pdf-service"
fi
