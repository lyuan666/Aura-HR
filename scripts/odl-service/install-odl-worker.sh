#!/bin/bash
# =============================================================================
# YZSCHROS ODL PDF 服务 — Mac Mini 一键部署（独立版）
#
# 使用方法: 复制整个脚本内容，在 Mac Mini 终端粘贴执行
#   bash install-odl-worker.sh
#
# 或者直接 curl:
#   (先把这个文件传到 Mac Mini 上)
#
# 安装内容:
#   1. OpenJDK (Java 运行时)
#   2. Python venv + opendataloader-pdf + FastAPI
#   3. 独立 ODL 服务目录 /opt/yzschros-odl/
#   4. PM2 服务注册 + 开机自启
# =============================================================================
set -euo pipefail

RED='\033[0;31m' GREEN='\033[0;32m' YELLOW='\033[1;33m' NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

INSTALL_DIR="/opt/yzschros-odl"
VENV_DIR="$INSTALL_DIR/venv"
PORT="${ODL_PORT:-8900}"

echo "============================================"
echo "  YZSCHROS ODL PDF 服务 — 一键部署"
echo "============================================"
echo "  安装目录: $INSTALL_DIR"
echo "  端口:     $PORT"
echo ""

# ── Step 1: Java ─────────────────────────────────────────────────────────────
info "Step 1/5: 检查 Java 运行时"

if java -version &>/dev/null; then
    info "Java 已安装: $(java -version 2>&1 | head -1)"
else
    warn "Java 未安装，正在安装 OpenJDK..."
    command -v brew &>/dev/null || error "Homebrew 未安装。先运行: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    brew install openjdk
    info "Java 安装完成"
fi

JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk}"
export JAVA_HOME PATH="$JAVA_HOME/bin:$PATH"
java -version &>/dev/null || error "Java 不可用，检查 JAVA_HOME=$JAVA_HOME"

# ── Step 2: 安装目录 + venv ──────────────────────────────────────────────────
info "Step 2/5: 创建安装目录和 Python 虚拟环境"

sudo mkdir -p "$INSTALL_DIR"
sudo chown "$(whoami)" "$INSTALL_DIR"

if [ ! -f "$VENV_DIR/bin/python3" ]; then
    python3 -m venv "$VENV_DIR"
fi
info "venv: $VENV_DIR"

# ── Step 3: 安装依赖 ─────────────────────────────────────────────────────────
info "Step 3/5: 安装 Python 依赖"

source "$VENV_DIR/bin/activate"
pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org \
    opendataloader-pdf==2.4.3 fastapi "uvicorn[standard]" python-multipart \
    2>&1 | tail -3

python3 -c "from opendataloader_pdf import convert; print('  opendataloader-pdf OK')" || error "安装失败"
python3 -c "import fastapi; print('  fastapi OK')" || error "安装失败"

# ── Step 4: 写入服务文件 ─────────────────────────────────────────────────────
info "Step 4/5: 写入服务文件"

cat > "$INSTALL_DIR/app.py" << 'PYEOF'
"""OpenDataLoader PDF Extraction Sidecar Service"""
import logging, os, shutil, tempfile, time
from pathlib import Path
import opendataloader_pdf
from fastapi import FastAPI, File, HTTPException, UploadFile

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("odl-service")
app = FastAPI(title="ODL PDF Extraction Service")
PORT = int(os.environ.get("ODL_PORT", "8900"))

@app.get("/health")
async def health():
    return {"status": "ok", "engine": "opendataloader-pdf"}

@app.post("/extract")
async def extract(file: UploadFile = File(...)):
    filename = file.filename or "upload.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    tmp_dir = None
    try:
        tmp_dir = tempfile.mkdtemp(prefix="odl_")
        input_path = Path(tmp_dir) / filename
        output_dir = Path(tmp_dir) / "output"
        start_time = time.time()

        content = await file.read()
        if len(content) > 20 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large (max 20MB)")
        with open(input_path, "wb") as f:
            f.write(content)

        opendataloader_pdf.convert(
            input_path=str(input_path),
            output_dir=str(output_dir),
            format="markdown",
            quiet=True,
        )

        md_files = list(output_dir.rglob("*.md"))
        if not md_files:
            raise HTTPException(status_code=500, detail="Extraction produced no markdown output")

        markdown_content = md_files[0].read_text(encoding="utf-8")
        elapsed = time.time() - start_time
        logger.info("Extracted %d chars from %s in %.2fs", len(markdown_content), filename, elapsed)

        return {"markdown": markdown_content, "char_count": len(markdown_content), "elapsed_seconds": round(elapsed, 2)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Extraction failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="PDF extraction failed. Check server logs for details.")
    finally:
        if tmp_dir and Path(tmp_dir).exists():
            shutil.rmtree(tmp_dir, ignore_errors=True)

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting ODL service on port %d", PORT)
    uvicorn.run(app, host="0.0.0.0", port=PORT)
PYEOF

info "app.py 写入完成: $INSTALL_DIR/app.py"

# ── Step 5: PM2 注册 ─────────────────────────────────────────────────────────
info "Step 5/5: PM2 服务注册"

command -v pm2 &>/dev/null || { warn "安装 PM2..."; npm install -g pm2; }

# 写 PM2 配置
cat > "$INSTALL_DIR/pm2.config.js" << PM2EOF
module.exports = {
  apps: [{
    name: "odl-pdf-service",
    script: "$INSTALL_DIR/app.py",
    interpreter: "$VENV_DIR/bin/python3",
    env: {
      ODL_PORT: "$PORT",
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

pm2 delete odl-pdf-service 2>/dev/null || true
pm2 start "$INSTALL_DIR/pm2.config.js"
pm2 save

info "等待服务启动..."
sleep 3

# ── 验证 ─────────────────────────────────────────────────────────────────────
HEALTH=$(curl -s "http://localhost:$PORT/health" 2>/dev/null || echo "FAILED")
if echo "$HEALTH" | grep -q '"ok"'; then
    echo ""
    echo -e "${GREEN}============================================"
    echo "  部署成功!"
    echo -e "============================================${NC}"
    echo ""
    echo "  服务地址: http://localhost:$PORT"
    echo "  健康检查: curl http://localhost:$PORT/health"
    echo "  查看日志: pm2 logs odl-pdf-service"
    echo "  重启:     pm2 restart odl-pdf-service"
    echo "  停止:     pm2 stop odl-pdf-service"
    echo ""
    echo -e "${YELLOW}下一步: 在 Worker 的 .env 或环境变量中添加:${NC}"
    echo "  ODL_URL=http://localhost:$PORT"
    echo ""
    echo "  然后重启 Worker: pm2 restart yzschros-worker"
    echo ""
else
    echo ""
    error "服务启动失败。检查日志: pm2 logs odl-pdf-service"
fi
