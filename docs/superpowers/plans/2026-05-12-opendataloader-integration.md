# OpenDataLoader PDF 集成实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 OpenDataLoader PDF 替代 MinerU 作为简历 PDF 提取的首选引擎，将单份简历提取从 5-15s 降到 <1s。

**Architecture:** 在 Mac Mini 上部署一个轻量 FastAPI 服务，包装 opendataloader-pdf Python 库。Node.js API 的 `PdfExtractionService` 新增 ODL 提取方法（Level 0），在 MinerU 之前优先调用。通过 `ODL_URL` 环境变量控制是否启用，ECS 未配置时自动降级到 MinerU，零风险部署。

**Tech Stack:** Python 3.13 + FastAPI + opendataloader-pdf 2.4.3 + Java 23 (OpenJDK) + NestJS

**验证结果（Mac Mini 本地测试）:**
- 郭煌辉简历（2页 PDF）：平均 0.9s（MinerU 同份需 5-15s）
- 提取质量：姓名/手机/公司/职位/工作经历/教育全部正确
- 依赖：Java 11+（已安装）+ opendataloader-pdf（已安装）

---

## File Structure

| 操作 | 文件 | 职责 |
|------|------|------|
| CREATE | `scripts/odl-service/app.py` | FastAPI 服务，包装 opendataloader-pdf |
| CREATE | `scripts/odl-service/requirements.txt` | Python 依赖 |
| CREATE | `scripts/odl-service/start.sh` | 启动脚本（设置 JAVA_HOME） |
| MODIFY | `apps/api/src/modules/ai/pdf-extraction.service.ts` | 新增 ODL Level 0 提取 |
| MODIFY | `apps/api/src/modules/ai/pdf-extraction.service.ts:5-9` | ExtractedContent.method 新增 `'odl'` |
| TEST | `scripts/odl-service/test_odl.py` | 端到端验证脚本 |

---

### Task 1: 创建 ODL FastAPI 提取服务

**Files:**
- Create: `scripts/odl-service/app.py`
- Create: `scripts/odl-service/requirements.txt`
- Create: `scripts/odl-service/start.sh`

- [ ] **Step 1: 创建 requirements.txt**

```
# scripts/odl-service/requirements.txt
fastapi==0.115.12
uvicorn[standard]==0.34.3
opendataloader-pdf==2.4.3
python-multipart==0.0.20
```

- [ ] **Step 2: 创建 FastAPI 应用**

```python
# scripts/odl-service/app.py
"""
OpenDataLoader PDF 提取服务 — Mac Mini 本地部署

接口与 MinerU /pdf/parse 兼容，返回 markdown 文本。
仅处理 PDF 文件，非 PDF 返回 400。
"""

import os
import shutil
import tempfile
import time
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("odl-service")

app = FastAPI(title="ODL PDF Extraction Service", version="1.0.0")


@app.get("/health")
async def health():
    return {"status": "ok", "engine": "opendataloader-pdf"}


@app.post("/extract")
async def extract_pdf(file: UploadFile = File(...)):
    """接收 PDF 文件，返回提取的 markdown 文本。"""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    start = time.time()
    tmp_dir = tempfile.mkdtemp(prefix="odl-")
    try:
        # 1. 保存上传文件到临时目录
        input_path = os.path.join(tmp_dir, "input.pdf")
        content = await file.read()
        with open(input_path, "wb") as f:
            f.write(content)

        # 2. 调用 opendataloader-pdf 提取
        from opendataloader_pdf import convert

        output_dir = os.path.join(tmp_dir, "output")
        os.makedirs(output_dir, exist_ok=True)

        convert(
            input_path=input_path,
            output_dir=output_dir,
            format="markdown",
            quiet=True,
        )

        # 3. 读取输出的 markdown 文件
        md_content = ""
        for f_name in os.listdir(output_dir):
            if f_name.endswith(".md"):
                with open(os.path.join(output_dir, f_name), "r", encoding="utf-8") as f:
                    md_content = f.read()
                break

        if not md_content:
            raise HTTPException(status_code=500, detail="Extraction returned empty content")

        elapsed = time.time() - start
        logger.info(f"Extracted {file.filename}: {len(md_content)} chars in {elapsed:.2f}s")

        return JSONResponse({
            "markdown": md_content,
            "char_count": len(md_content),
            "elapsed_seconds": round(elapsed, 2),
        })

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Extraction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("ODL_PORT", "8900"))
    uvicorn.run(app, host="0.0.0.0", port=port)
```

- [ ] **Step 3: 创建启动脚本**

```bash
#!/bin/bash
# scripts/odl-service/start.sh — ODL 服务启动脚本
set -e

# 设置 Java 路径（macOS Homebrew）
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk}"
export PATH="$JAVA_HOME/bin:$PATH"

# 验证 Java
if ! command -v java &>/dev/null; then
    echo "ERROR: Java not found. Install with: brew install openjdk"
    exit 1
fi

# 验证 opendataloader-pdf
python3 -c "from opendataloader_pdf import convert; print('opendataloader-pdf OK')" || {
    echo "ERROR: opendataloader-pdf not installed"
    echo "Run: pip3 install opendataloader-pdf (or use venv)"
    exit 1
}

PORT="${ODL_PORT:-8900}"
echo "Starting ODL PDF service on port $PORT..."
exec python3 "$(dirname "$0")/app.py"
```

- [ ] **Step 4: 本地启动验证**

```bash
# 设置权限
chmod +x scripts/odl-service/start.sh

# 启动服务（前台）
cd /Users/lee/Desktop/YZSCHROS && bash scripts/odl-service/start.sh &

# 等待启动
sleep 3

# 健康检查
curl -s http://localhost:8900/health
# 预期: {"status":"ok","engine":"opendataloader-pdf"}

# 测试提取
curl -s -X POST http://localhost:8900/extract \
  -F "file=@/Users/lee/Downloads/【私域渠道女装运营经理_杭州 25-50K】郭煌辉 8年.pdf" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"chars={d['char_count']} time={d['elapsed_seconds']}s\")"
# 预期: chars=~2300 time=<1.5s

# 停止服务
kill %1
```

- [ ] **Step 5: Commit**

```bash
git add scripts/odl-service/
git commit -m "feat: add OpenDataLoader PDF extraction sidecar service"
```

---

### Task 2: 修改 PdfExtractionService 支持 ODL

**Files:**
- Modify: `apps/api/src/modules/ai/pdf-extraction.service.ts`

- [ ] **Step 1: 修改 ExtractedContent 接口**

在 `pdf-extraction.service.ts` 第 8 行，method 类型新增 `'odl'`：

```typescript
// 修改前
method: 'mineru' | 'pdf-parse' | 'mammoth' | 'vision' | 'direct';

// 修改后
method: 'odl' | 'mineru' | 'pdf-parse' | 'mammoth' | 'vision' | 'direct';
```

- [ ] **Step 2: 添加 ODL 提取方法**

在 `PdfExtractionService` 类中，`extractWithMinerU` 方法之前（约第 100 行），新增：

```typescript
  /**
   * Level 0: OpenDataLoader PDF (本地最快，Mac Mini 部署)
   */
  private async extractWithODL(buffer: Buffer): Promise<string> {
    const odlUrl = process.env.ODL_URL?.trim();
    if (!odlUrl || odlUrl === 'disabled') {
      throw new Error('ODL disabled');
    }

    const formData = new FormData();
    formData.append('file', new Blob([new Uint8Array(buffer)]), 'resume.pdf');

    const response = await axios.post(
      `${odlUrl}/extract`,
      formData,
      { timeout: 15000, headers: { 'Content-Type': 'multipart/form-data' } },
    );

    const markdown: string = response.data.markdown || response.data.content;
    if (!markdown || markdown.length < 30) {
      throw new Error(`ODL returned insufficient content (${markdown?.length || 0} chars)`);
    }
    return markdown;
  }
```

- [ ] **Step 3: 在降级链中插入 ODL 作为 Level 0**

修改 `extractStructuredText` 方法中 PDF 处理部分（第 44-68 行）。在现有 Level 1 (MinerU) 之前插入 ODL 调用：

```typescript
    // PDF → 四级降级 (ODL → MinerU → pdf-parse → Vision)
    if (ext === '.pdf') {
      // Level 0: OpenDataLoader PDF (Mac Mini 本地, ~0.9s)
      const odlUrl = process.env.ODL_URL?.trim();
      const odlEnabled = Boolean(odlUrl && odlUrl !== 'disabled');
      if (odlEnabled) {
        try {
          const md = await this.extractWithODL(buffer);
          if (md && md.length > 30) {
            return { text: md, format: 'markdown', method: 'odl' };
          }
        } catch (e: any) {
          this.logger.warn(`ODL 提取失败: ${e.message}`);
        }
      }

      // Level 1: MinerU (with circuit breaker)
      const mineruUrl = process.env.MINERU_URL?.trim();
      const mineruEnabled = Boolean(mineruUrl && mineruUrl !== 'disabled');
      if (mineruEnabled && !this.mineruCircuitOpen) {
        // ... 保持原有 MinerU 逻辑不变 ...
      }
      // ... 后续 Level 2, 3 保持不变 ...
    }
```

完整的修改后的 `extractStructuredText` 方法（PDF 部分，第 44-98 行替换为）：

```typescript
    // PDF → 四级降级 (ODL → MinerU → pdf-parse → Vision)
    if (ext === '.pdf') {
      // Level 0: OpenDataLoader PDF (Mac Mini 本地, ~0.9s)
      const odlUrl = process.env.ODL_URL?.trim();
      const odlEnabled = Boolean(odlUrl && odlUrl !== 'disabled');
      if (odlEnabled) {
        try {
          const md = await this.extractWithODL(buffer);
          if (md && md.length > 30) {
            return { text: md, format: 'markdown', method: 'odl' };
          }
        } catch (e: any) {
          this.logger.warn(`ODL 提取失败: ${e.message}`);
        }
      }

      // Level 1: MinerU (with circuit breaker)
      const mineruUrl = process.env.MINERU_URL?.trim();
      const mineruEnabled = Boolean(mineruUrl && mineruUrl !== 'disabled');
      if (mineruEnabled && !this.mineruCircuitOpen) {
        try {
          const md = await this.extractWithMinerU(buffer);
          if (md && md.length > 30) {
            this.mineruConsecutiveFailures = 0;
            return { text: md, format: 'markdown', method: 'mineru' };
          }
        } catch (e: any) {
          this.mineruConsecutiveFailures++;
          this.logger.warn(`MinerU 提取失败 (${this.mineruConsecutiveFailures}x): ${e.message}`);
          if (this.mineruConsecutiveFailures >= 3) {
            this.mineruCircuitOpen = true;
            this.mineruCircuitResetAt = Date.now() + 60000;
            this.logger.warn('MinerU circuit breaker OPEN — skipping for 60s');
          }
        }
      } else if (Date.now() > this.mineruCircuitResetAt) {
        this.mineruCircuitOpen = false;
        this.mineruConsecutiveFailures = 0;
      }

      // Level 2: pdf-parse 降级 (v2 API: PDFParse class)
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { PDFParse } = require('pdf-parse');
        const parser = new PDFParse({ data: new Uint8Array(buffer) });
        const result = await parser.getText();
        if (result && result.text && result.text.length > 50) {
          return { text: result.text, format: 'plain', method: 'pdf-parse' };
        }
      } catch (e: any) {
        this.logger.warn(`pdf-parse 失败: ${e.message}`);
      }
    }
```

- [ ] **Step 4: 本地编译验证**

```bash
cd /Users/lee/Desktop/YZSCHROS/apps/api && npx tsc --noEmit src/modules/ai/pdf-extraction.service.ts
# 预期: 无错误
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/ai/pdf-extraction.service.ts
git commit -m "feat: add OpenDataLoader PDF as Level 0 extraction in PdfExtractionService"
```

---

### Task 3: Mac Mini 本地端到端验证

**Files:**
- Create: `scripts/odl-service/test_e2e.py`

- [ ] **Step 1: 创建端到端测试脚本**

```python
#!/usr/bin/env python3
"""
scripts/odl-service/test_e2e.py
端到端验证：启动 ODL 服务 → 上传 PDF → 验证提取结果
"""
import os
import sys
import json
import time
import subprocess
import requests

PDF_PATH = "/Users/lee/Downloads/【私域渠道女装运营经理_杭州 25-50K】郭煌辉 8年.pdf"
ODL_URL = "http://localhost:8900"

def test_health():
    r = requests.get(f"{ODL_URL}/health", timeout=5)
    assert r.status_code == 200, f"Health check failed: {r.status_code}"
    data = r.json()
    assert data["status"] == "ok"
    print(f"  PASS: health={data}")

def test_extract():
    assert os.path.exists(PDF_PATH), f"Test PDF not found: {PDF_PATH}"

    start = time.time()
    with open(PDF_PATH, "rb") as f:
        r = requests.post(f"{ODL_URL}/extract", files={"file": f}, timeout=30)
    elapsed = time.time() - start

    assert r.status_code == 200, f"Extract failed: {r.status_code} {r.text[:200]}"
    data = r.json()

    md = data["markdown"]
    assert len(md) > 100, f"Content too short: {len(md)} chars"
    assert "郭煌辉" in md, "Name not found in extracted content"
    assert "13071883835" in md, "Phone not found in extracted content"
    assert "运营" in md, "Job title keyword not found"

    print(f"  PASS: extracted {len(md)} chars in {elapsed:.2f}s (service: {data['elapsed_seconds']}s)")

    # 验证关键信息完整性
    checks = {
        "姓名": "郭煌辉",
        "手机": "1307188",
        "年龄": "32",
        "工作经历": "杭州盟鸽",
        "教育": "山西财经大学",
    }
    for label, keyword in checks.items():
        found = keyword in md
        status = "OK" if found else "MISSING"
        print(f"  [{status}] {label}: {keyword}")

    return data

def test_speed(runs=3):
    """连续 3 次提取取平均"""
    times = []
    for i in range(runs):
        start = time.time()
        with open(PDF_PATH, "rb") as f:
            r = requests.post(f"{ODL_URL}/extract", files={"file": f}, timeout=30)
        elapsed = time.time() - start
        assert r.status_code == 200
        times.append(elapsed)
        print(f"  Run {i+1}: {elapsed:.3f}s")

    avg = sum(times) / len(times)
    print(f"  平均: {avg:.3f}s")
    assert avg < 3.0, f"Too slow: {avg:.3f}s average (target < 3s)"
    print(f"  PASS: 平均 {avg:.3f}s < 3s 目标")

if __name__ == "__main__":
    print("=== ODL 端到端测试 ===\n")

    print("1. 健康检查")
    test_health()

    print("\n2. 提取质量")
    test_extract()

    print("\n3. 速度基准 (3轮)")
    test_speed()

    print("\n=== 全部通过 ===")
```

- [ ] **Step 2: 运行端到端测试**

```bash
# 确保 ODL 服务在运行
bash scripts/odl-service/start.sh &
sleep 3

# 运行测试
python3 scripts/odl-service/test_e2e.py
# 预期: 全部 PASS

# 清理
kill %1
```

- [ ] **Step 3: Commit**

```bash
git add scripts/odl-service/test_e2e.py
git commit -m "test: add ODL service end-to-end test script"
```

---

### Task 4: Mac Mini 生产部署配置

**Files:**
- Create: `scripts/odl-service/pm2.config.js`

- [ ] **Step 1: 创建 PM2 配置**

```javascript
// scripts/odl-service/pm2.config.js
// Mac Mini ODL 服务 PM2 配置
// 使用: pm2 start scripts/odl-service/pm2.config.js

module.exports = {
  apps: [
    {
      name: "odl-pdf-service",
      script: "scripts/odl-service/app.py",
      interpreter: "python3",
      cwd: "/Users/lee/Desktop/YZSCHROS",
      env: {
        ODL_PORT: "8900",
        JAVA_HOME: "/opt/homebrew/opt/openjdk",
        PATH: "/opt/homebrew/opt/openjdk/bin:/usr/local/bin:/usr/bin:/bin",
      },
      max_memory_restart: "500M",
      max_restarts: 10,
      restart_delay: 5000,
      // 日志
      error_file: "/tmp/odl-pdf-error.log",
      out_file: "/tmp/odl-pdf-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
```

- [ ] **Step 2: Mac Mini 上部署 ODL 服务**

```bash
# 在 Mac Mini 上执行

# 1. 确保 Python venv 有 opendataloader-pdf
python3 -m venv /opt/yzschros/odl-venv
source /opt/yzschros/odl-venv/bin/activate
pip install opendataloader-pdf fastapi uvicorn python-multipart
deactivate

# 2. 用 PM2 启动 ODL 服务
cd /Users/lee/Desktop/YZSCHROS
pm2 start scripts/odl-service/pm2.config.js

# 3. 验证
pm2 list
curl http://localhost:8900/health
# 预期: {"status":"ok","engine":"opendataloader-pdf"}

# 4. 保存 PM2 配置（开机自启）
pm2 save
```

- [ ] **Step 3: 配置 BullMQ Worker 环境变量**

在 Mac Mini 的 worker 启动配置中（PM2 或 .env），添加：

```
ODL_URL=http://localhost:8900
```

这样 Mac Mini worker 调用 `PdfExtractionService` 时会优先使用 ODL（Level 0），降级到 MinerU（Level 1）→ pdf-parse（Level 2）→ Vision（Level 3）。

ECS 上不设置 `ODL_URL`，自动使用 MinerU，零影响。

- [ ] **Step 4: 验证完整链路**

```bash
# 上传测试简历，观察日志中 method='odl'
# 方法: 通过前端上传或 curl 直接调 API
curl -X POST http://47.97.62.57/api/candidates/batch-upload \
  -H "Authorization: Bearer <TOKEN>" \
  -F "files=@/Users/lee/Downloads/【私域渠道女装运营经理_杭州 25-50K】郭煌辉 8年.pdf"

# 检查 API 日志确认使用 ODL
pm2 logs yzschros-api --lines 50 | grep "method.*odl"
# 预期: 包含 method: 'odl'
```

- [ ] **Step 5: Commit**

```bash
git add scripts/odl-service/pm2.config.js
git commit -m "chore: add PM2 config for ODL PDF service on Mac Mini"
```

---

### Task 5: LLM 抽取提速（可选，独立于 ODL）

**Files:**
- Modify: `apps/api/src/modules/ai/parsing-v2.service.ts:220-223`
- Modify: `apps/api/src/modules/ai/llm-router.service.ts:110-114`

**背景:** ODL 将 PDF 提取从 5-15s 降到 <1s，但 LLM 结构化抽取仍需 15-25s。如需进一步优化：

- [ ] **Step 1: 切换 LLM 模型为更快的版本**

在 Mac Mini 的 worker .env 中设置：

```
# 当前: qwen-plus（较慢但质量高）
# 优化: qwen-turbo（快 3-5x，简历结构化场景质量够用）
LLM_RESUME_MODEL=qwen-turbo
```

- [ ] **Step 2: 减小 prompt 中的文本截断长度**

在 `parsing-v2.service.ts` 第 220 行，将截断从 4000 降到 3000：

```typescript
// 修改前
${text.substring(0, 4000)}

// 修改后（OpenDataLoader 提取的 markdown 更紧凑，3000 字符足够）
${text.substring(0, 3000)}
```

- [ ] **Step 3: 增加并发数**

在 Mac Mini 的 worker .env 中：

```
# 当前默认 3，Mac Mini 性能足够可以开到 5
LLM_CONCURRENCY=5
```

**预估效果:**
- 当前: PDF 提取 15s + LLM 20s = 35s
- ODL 后: PDF 提取 0.9s + LLM 20s = 21s
- ODL + qwen-turbo: PDF 0.9s + LLM 5-8s = **6-9s**

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/ai/parsing-v2.service.ts
git commit -m "perf: reduce LLM prompt truncation to 3000 chars for ODL-extracted markdown"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** PDF 提取加速（ODL Level 0）→ 已覆盖。Mac Mini 部署 → 已覆盖。降级机制 → 已覆盖。LLM 提速 → Task 5 可选。
- [x] **Placeholder scan:** 无 TBD/TODO/placeholder。所有步骤含完整代码。
- [x] **Type consistency:** `ExtractedContent.method` 新增 `'odl'` 类型与所有消费方兼容。`extractWithODL` 返回 `Promise<string>` 与 `extractWithMinerU` 签名一致。
- [x] **降级安全:** `ODL_URL` 未设置时完全跳过 ODL，ECS 零影响。
- [x] **部署铁律:** Task 4 的 PM2 cwd 设置为项目根目录，遵循 CLAUDE.md 规则 5。

---

## 预期最终效果

| 阶段 | 改造前 (MinerU) | 改造后 (ODL) | 改造后 + LLM 优化 |
|------|-----------------|-------------|-------------------|
| PDF 提取 | 5-15s | **0.9s** | **0.9s** |
| LLM 抽取 | 15-25s | 15-25s | **5-8s** |
| 去重+入库 | ~0.5s | ~0.5s | ~0.5s |
| **总计** | **20-38s** | **16-26s** | **6-9s** |
