import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { CandidateMergeLinkEntity } from '../../entities/candidate-merge-link.entity';
import { CandidateStagingEntity, StagingDecision } from '../../entities/candidate-staging.entity';
import { ImportBatchEntity } from '../../entities/import-batch.entity';
import { CandidateService } from '../candidate/candidate.service';
import { CreateExtensionCaptureDto, ReviewStagingCandidateDto } from './import.dto';
import { ImportDedupeService } from './import-dedupe.service';
import { ImportQualityService } from './import-quality.service';

export interface ImportActorContext {
  tenantId: string;
  operatorId?: string;
}

const STAGING_RESUME_TEXT_LIMIT = 50000;
const LIGHT_STAGING_FIELDS: Array<keyof CandidateStagingEntity> = [
  'id',
  'traceId',
  'sourceType',
  'sourcePlatform',
  'sourceUrl',
  'name',
  'phone',
  'email',
  'currentCompany',
  'currentTitle',
  'qualityScore',
  'qualityReasons',
  'status',
  'importDecision',
  'matchedCandidateId',
  'createdCandidateId',
  'createdAt',
  'updatedAt',
];

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(CandidateStagingEntity)
    private readonly stagingRepo: Repository<CandidateStagingEntity>,
    @InjectRepository(ImportBatchEntity)
    private readonly batchRepo: Repository<ImportBatchEntity>,
    @InjectRepository(CandidateMergeLinkEntity)
    private readonly mergeLinkRepo: Repository<CandidateMergeLinkEntity>,
    private readonly quality: ImportQualityService,
    private readonly importDedupe: ImportDedupeService,
    private readonly candidateService: CandidateService,
  ) {}

  async createExtensionCapture(dto: CreateExtensionCaptureDto, actor: ImportActorContext) {
    const traceId = dto.traceId || randomUUID();
    const resumeText = dto.rawText.substring(0, STAGING_RESUME_TEXT_LIMIT);
    const normalizedPhone = this.quality.normalizePhone(this.extractPhone(dto.rawText));
    const normalizedEmail = this.quality.normalizeEmail(this.extractEmail(dto.rawText));
    const textHash = this.quality.computeTextHash(resumeText);
    const quality = this.quality.score({
      name: dto.name,
      normalizedPhone,
      normalizedEmail,
      resumeText,
      currentCompany: dto.company,
      currentTitle: dto.title,
      sourceUrl: dto.sourceUrl,
      sourceRecordId: dto.sourceRecordId,
    });
    const duplicate = await this.importDedupe.findDuplicate({
      tenantId: actor.tenantId,
      normalizedPhone,
      normalizedEmail,
      textHash,
      name: dto.name,
      currentCompany: dto.company,
      sourcePlatform: dto.sourcePlatform,
    });

    const importDecision: StagingDecision =
      duplicate.status === 'duplicate' ? 'review' : quality.decision;
    const row = this.stagingRepo.create({
      tenantId: actor.tenantId,
      traceId,
      sourceType: 'chrome_extension',
      sourcePlatform: dto.sourcePlatform,
      sourceUrl: dto.sourceUrl,
      sourceRecordId: dto.sourceRecordId,
      rawPayload: this.buildExtensionRawPayload(dto, actor.operatorId),
      name: dto.name,
      phone: normalizedPhone,
      email: normalizedEmail,
      normalizedPhone,
      normalizedEmail,
      currentCompany: dto.company,
      currentTitle: dto.title,
      resumeText,
      resumeTextTruncated: dto.rawText.length > STAGING_RESUME_TEXT_LIMIT,
      textHash,
      qualityScore: quality.score,
      qualityReasons: quality.reasons,
      status: 'scored',
      importDecision,
      reviewReason: duplicate.status === 'duplicate' ? `possible_duplicate:${duplicate.matchType}` : undefined,
      matchedCandidateId: duplicate.status === 'duplicate' ? duplicate.candidateId : undefined,
      normalizedPayload: {},
    } as any);

    return this.stagingRepo.save(row);
  }

  findBatches(tenantId: string) {
    return this.batchRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  findStaging(tenantId: string) {
    return this.stagingRepo.find({
      where: { tenantId },
      select: LIGHT_STAGING_FIELDS as any,
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async findStagingDetail(id: string, tenantId: string) {
    const row = await this.stagingRepo.findOne({ where: { id, tenantId } });
    if (!row) throw new NotFoundException('导入暂存记录不存在');
    return row;
  }

  async updateDecision(id: string, dto: ReviewStagingCandidateDto, actor: ImportActorContext) {
    const row = await this.findStagingDetail(id, actor.tenantId);
    row.importDecision = dto.decision;
    row.rejectReason = (dto.decision === 'reject' ? dto.rejectReason || undefined : undefined) as any;
    row.status = dto.decision === 'reject' ? 'rejected' : row.status;
    return this.stagingRepo.save(row);
  }

  async promoteToCandidate(id: string, actor: ImportActorContext) {
    const row = await this.findStagingDetail(id, actor.tenantId);
    if (!row.name) throw new BadRequestException('候选人姓名缺失，无法入库');
    if (!row.phone && !row.email && !row.resumeText) {
      throw new BadRequestException('缺少联系方式或简历文本，无法入库');
    }

    const duplicate = await this.importDedupe.findDuplicate({
      tenantId: actor.tenantId,
      normalizedPhone: row.normalizedPhone,
      normalizedEmail: row.normalizedEmail,
      textHash: row.textHash,
      fileHash: row.fileHash,
      name: row.name,
      currentCompany: row.currentCompany,
      sourcePlatform: row.sourcePlatform,
    });
    if (duplicate.status === 'duplicate' && duplicate.confidence >= 0.95) {
      return this.markMerged(row, duplicate.candidateId, duplicate.matchType, duplicate.confidence, actor);
    }

    try {
      const candidate = await this.candidateService.create(
        {
          name: row.name,
          phone: row.phone,
          email: row.email,
          currentCompany: row.currentCompany,
          currentTitle: row.currentTitle,
          resumeText: row.resumeText,
          sourcePlatform: row.sourcePlatform || row.sourceType,
          importedBy: actor.operatorId,
          parsedTags: {
            ...row.normalizedPayload,
            legacy: row.rawPayload,
            import: {
              stagingId: row.id,
              batchId: row.batchId,
              sourceUrl: row.sourceUrl,
              traceId: row.traceId,
            },
          },
          status: 'new',
        } as any,
        actor.tenantId,
      );
      row.status = 'merged';
      row.importDecision = 'candidate';
      row.createdCandidateId = candidate.id;
      await this.stagingRepo.save(row);
      await this.mergeLinkRepo.save(
        this.mergeLinkRepo.create({
          tenantId: actor.tenantId,
          stagingCandidateId: row.id,
          candidateId: candidate.id,
          matchType: 'manual',
          confidence: 1,
          operatorId: actor.operatorId,
        }),
      );
      return { status: 'created', candidateId: candidate.id };
    } catch (error) {
      if (error instanceof ConflictException) {
        const candidateId = this.extractConflictCandidateId(error);
        if (candidateId) {
          return this.markMerged(row, candidateId, 'manual', 1, actor);
        }
      }
      throw error;
    }
  }

  private async markMerged(
    row: CandidateStagingEntity,
    candidateId: string,
    matchType: string,
    confidence: number,
    actor: ImportActorContext,
  ) {
    row.status = 'merged';
    row.importDecision = 'candidate';
    row.matchedCandidateId = candidateId;
    await this.stagingRepo.save(row);
    await this.mergeLinkRepo.save(
      this.mergeLinkRepo.create({
        tenantId: actor.tenantId,
        stagingCandidateId: row.id,
        candidateId,
        matchType: matchType as any,
        confidence,
        operatorId: actor.operatorId,
      }),
    );
    return { status: 'merged', candidateId };
  }

  private buildExtensionRawPayload(dto: CreateExtensionCaptureDto, operatorId?: string) {
    return {
      sourcePlatform: dto.sourcePlatform,
      sourceUrl: dto.sourceUrl,
      sourceRecordId: dto.sourceRecordId,
      operatorId,
      rawTextPreview: dto.rawText.substring(0, 2000),
      capturedAt: new Date().toISOString(),
    };
  }

  private extractPhone(text: string) {
    return text.match(/1[3-9]\d[\d\s-]{8,13}\d/)?.[0] || null;
  }

  private extractEmail(text: string) {
    return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || null;
  }

  private extractConflictCandidateId(error: ConflictException) {
    const response = error.getResponse() as any;
    return response?.data?.id;
  }
}
