import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as path from 'path';

export interface ExtractedContent {
  text: string;
  format: 'markdown' | 'plain';
  method: 'odl' | 'mineru' | 'pdf-parse' | 'mammoth' | 'vision' | 'direct';
}

/**
 * PdfExtractionService — 三级降级 PDF 提取
 *
 * Level 1: MinerU (结构化 Markdown)
 * Level 2: pdf-parse (纯文本降级)
 * Level 3: Vision LLM (扫描件/图片)
 */
@Injectable()
export class PdfExtractionService {
  private readonly logger = new Logger(PdfExtractionService.name);
  private mineruConsecutiveFailures = 0;
  private mineruCircuitOpen = false;
  private mineruCircuitResetAt = 0;

  async extractStructuredText(
    buffer: Buffer,
    fileName: string,
    visionCallback?: (buffer: Buffer) => Promise<string>,
  ): Promise<ExtractedContent> {
    const ext = path.extname(fileName).toLowerCase();

    // DOCX → mammoth (已有)
    if (ext === '.docx') {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return { text: result.value, format: 'plain', method: 'mammoth' };
    }

    // TXT → 直接返回
    if (ext === '.txt') {
      return { text: buffer.toString('utf-8'), format: 'plain', method: 'direct' };
    }

    // PDF → 四级降级
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
      if (!this.mineruCircuitOpen) {
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

    // Level 3: Vision LLM (扫描件/图片)
    if (['.pdf', '.jpg', '.jpeg', '.png'].includes(ext)) {
      if (visionCallback) {
        try {
          const visionText = await visionCallback(buffer);
          if (visionText && visionText.length > 20) {
            return { text: visionText, format: 'plain', method: 'vision' };
          }
        } catch (e: any) {
          this.logger.warn(`Vision 提取失败: ${e.message}`);
        }
      }
    }

    throw new Error(`无法提取文件内容: ${fileName}`);
  }

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

  private async extractWithMinerU(buffer: Buffer): Promise<string> {
    const isGpuAvailable = process.env.MINERU_DEVICE === 'cuda';
    const mineruUrl = process.env.MINERU_URL || 'http://localhost:8000';

    const formData = new FormData();
    formData.append('file', new Blob([new Uint8Array(buffer)]), 'resume.pdf');

    const params = isGpuAvailable ? {} : {
      parse_method: 'ocr',
      disable_formula: 'true',
      disable_table: 'false',
    };

    const response = await axios.post(
      `${mineruUrl}/pdf/parse`,
      formData,
      { timeout: 30000, params, headers: { 'Content-Type': 'multipart/form-data' } },
    );

    return response.data.markdown || response.data.content;
  }
}
