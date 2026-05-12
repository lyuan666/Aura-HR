#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# OpenDataLoader PDF Extraction Service - Startup Script
# ---------------------------------------------------------------------------
# Sets JAVA_HOME (macOS Homebrew) and launches the FastAPI service.
# Port is configurable via ODL_PORT env var (default: 8900).
# ---------------------------------------------------------------------------

set -euo pipefail

# Java configuration (macOS Homebrew)
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk}"
export PATH="${JAVA_HOME}/bin:${PATH}"

# Service port
ODL_PORT="${ODL_PORT:-8900}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "============================================"
echo " ODL PDF Extraction Service"
echo "============================================"
echo " JAVA_HOME : ${JAVA_HOME}"
echo " PORT      : ${ODL_PORT}"
echo " DIR       : ${SCRIPT_DIR}"
echo "============================================"

# Verify Java
if ! command -v java &>/dev/null; then
    echo "ERROR: java not found in PATH. Ensure OpenJDK is installed."
    echo "  brew install openjdk"
    exit 1
fi
echo "Java version: $(java -version 2>&1 | head -1)"

# Verify opendataloader-pdf
if ! python3 -c "import opendataloader_pdf" 2>/dev/null; then
    echo "ERROR: opendataloader-pdf not installed."
    echo "  pip3 install opendataloader-pdf==2.4.3"
    exit 1
fi
echo "opendataloader-pdf: $(python3 -c 'import opendataloader_pdf; print(getattr(opendataloader_pdf, "__version__", "available"))')"

# Launch service
echo ""
echo "Starting service on port ${ODL_PORT}..."
exec python3 "${SCRIPT_DIR}/app.py"
