import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecommendationEntity } from '../../entities/recommendation.entity';
import { CandidateEntity } from '../../entities/candidate.entity';
import { JobPositionEntity } from '../../entities/job-position.entity';
import { generateRecommendationPdfDefinition } from './templates/recommendation-pdf';
const PdfPrinter = require('pdfmake/js/Printer').default;
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);
  private printer: any;

  constructor(
    @InjectRepository(RecommendationEntity)
    private readonly recommendationRepo: Repository<RecommendationEntity>,
    @InjectRepository(CandidateEntity)
    private readonly candidateRepo: Repository<CandidateEntity>,
    @InjectRepository(JobPositionEntity)
    private readonly jobRepo: Repository<JobPositionEntity>,
  ) {
    // 配置字体
    const fonts = {
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };
    this.printer = new (PdfPrinter as any)(fonts);
  }

  async generateRecommendationReport(recommendationId: string, tenantId?: string): Promise<Buffer> {
    const rec = await this.recommendationRepo.findOne({
      where: { id: recommendationId, ...(tenantId ? { tenantId } : {}) },
    });

    if (!rec) throw new NotFoundException('推荐记录不存在');

    const candidate = await this.candidateRepo.findOne({ where: { id: rec.candidateId } });
    const job = await this.jobRepo.findOne({ where: { id: rec.jobPositionId } });

    if (!candidate || !job) throw new NotFoundException('候选人或职位数据不完整');

    const docDefinition: TDocumentDefinitions = generateRecommendationPdfDefinition({
      candidate,
      job,
      analysis: rec.aiAnalysis,
    });

    return new Promise((resolve, reject) => {
      try {
        const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
        const chunks: any[] = [];
        pdfDoc.on('data', (chunk: any) => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.end();
      } catch (err) {
        this.logger.error(`PDF 生成失败: ${err.message}`);
        reject(err);
      }
    });
  }
}
