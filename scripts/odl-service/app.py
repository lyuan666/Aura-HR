"""
OpenDataLoader PDF Extraction Sidecar Service

Wraps opendataloader-pdf into an HTTP service for resume parsing.
The Node.js API's PdfExtractionService calls this via HTTP instead of MinerU.
"""

import logging
import os
import shutil
import tempfile
import time
from pathlib import Path

import opendataloader_pdf
from fastapi import FastAPI, File, HTTPException, UploadFile

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("odl-service")

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="ODL PDF Extraction Service")

PORT = int(os.environ.get("ODL_PORT", 8900))


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "engine": "opendataloader-pdf"}


@app.post("/extract")
async def extract(file: UploadFile = File(...)):
    """
    Accept a PDF file upload, extract markdown via opendataloader-pdf,
    and return the markdown content with metadata.
    """
    # Validate file type
    filename = file.filename or "upload.pdf"
    if not filename.lower().endswith(".pdf"):
        logger.warning("Rejected non-PDF upload: %s", filename)
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    tmp_dir = None
    try:
        # Create a temporary working directory
        tmp_dir = tempfile.mkdtemp(prefix="odl_")
        input_path = Path(tmp_dir) / filename
        output_dir = Path(tmp_dir) / "output"

        logger.info("Processing file: %s (%s)", filename, tmp_dir)

        # Write uploaded file to disk
        start_time = time.time()
        with open(input_path, "wb") as f:
            content = await file.read()
            if len(content) > 20 * 1024 * 1024:  # 20 MB limit
                raise HTTPException(status_code=413, detail="File too large (max 20MB)")
            f.write(content)
        logger.info("File written: %d bytes", len(content))

        # Run extraction
        opendataloader_pdf.convert(str(input_path), str(output_dir))
        logger.info("Extraction complete, reading output")

        # Find and read the output markdown file
        md_files = list(output_dir.rglob("*.md"))
        if not md_files:
            raise HTTPException(
                status_code=500,
                detail="Extraction produced no markdown output",
            )

        # Use the first .md file found
        markdown_content = md_files[0].read_text(encoding="utf-8")
        elapsed = time.time() - start_time

        logger.info(
            "Extracted %d chars from %s in %.2fs",
            len(markdown_content),
            filename,
            elapsed,
        )

        return {
            "markdown": markdown_content,
            "char_count": len(markdown_content),
            "elapsed_seconds": round(elapsed, 2),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Extraction failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="PDF extraction failed. Check server logs for details.",
        )
    finally:
        # Clean up temporary directory
        if tmp_dir and Path(tmp_dir).exists():
            shutil.rmtree(tmp_dir, ignore_errors=True)
            logger.info("Cleaned up temp dir: %s", tmp_dir)


if __name__ == "__main__":
    import uvicorn

    logger.info("Starting ODL service on port %d", PORT)
    uvicorn.run(app, host="0.0.0.0", port=PORT)
