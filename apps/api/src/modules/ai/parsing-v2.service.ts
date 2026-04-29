import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { LlmRouterService } from './llm-router.service';
import { PdfExtractionService, ExtractedContent } from './pdf-extraction.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateEntity } from '../../entities/candidate.entity';
import { StorageService } from '../storage/storage.service';

export interface ParseJobData {
  tenantId: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  fileHash: string;
  sourcePlatform?: string;
  batchId?: string;
}

export interface DupCheckResult {
  isDuplicate: boolean;
  candidateId?: string;
  matchField?: string;
  confidence?: number;
}

/**
 * ParsingV2Service — 完整的简历解析管线
 *
 * 提取 → 四层去重 → LLM 结构化抽取 → 幂等入库
 */
@Injectable()
export class ParsingV2Service {
  private readonly logger = new Logger(ParsingV2Service.name);

  constructor(
    private readonly pdfExtraction: PdfExtractionService,
    private readonly llmRouter: LlmRouterService,
    private readonly storage: StorageService,
    @InjectRepository(CandidateEntity)
    private readonly candidateRepo: Repository<CandidateEntity>,
  ) {}

  /**
   * 文本内容指纹 (白名单策略)
   */
  static computeTextHash(text: string): string {
    const normalized = text
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '')
      .toLowerCase();
    return createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * 完整解析流程 (由 BullMQ Worker 调用)
   */
  async parseResume(
    data: ParseJobData,
    emit: (status: string, progress: number) => void,
    visionCallback?: (buffer: Buffer) => Promise<string>,
  ) {
    // Step 1: 从 MinIO 读取文件并提取文本
    emit('extracting', 10);
    const buffer = await this.storage.getObject('uploads', data.fileKey);
    const content = await this.pdfExtraction.extractStructuredText(
      buffer,
      data.fileName,
      visionCallback,
    );

    // Step 2: 计算文本指纹
    emit('parsing', 30);
    const textHash = ParsingV2Service.computeTextHash(content.text);

    // Step 3: 文本指纹去重
    emit('deduping', 40);
    const dupCheck = await this.checkDuplicate(content.text, data.tenantId, textHash);
    if (dupCheck.isDuplicate) {
      return { status: 'duplicate' as const, ...dupCheck, textHash };
    }

    // Step 4: LLM 结构化抽取
    emit('parsing', 50);
    const profile = await this.extractStructured(content.text, data.fileName);

    // Step 5: phone/email 精确去重
    emit('deduping', 60);
    // 再次用 profile 中的 phone/email 做精确去重
    const profileDup = await this.checkDuplicateByProfile(profile, data.tenantId);
    if (profileDup.isDuplicate) {
      return { status: 'duplicate' as const, ...profileDup, textHash };
    }

    // Step 5: 幂等入库
    emit('saving', 80);
    const result = await this.upsertByFileHash({
      ...profile,
      tenantId: data.tenantId,
      sourcePlatform: data.sourcePlatform || 'manual_upload',
      fileHash: data.fileHash,
      textHash,
      resumeText: content.text.substring(0, 5000),
    });

    emit('completed', 100);
    return {
      status: 'success' as const,
      candidateId: result.id,
      isNew: result.isNew,
      textHash,
    };
  }

  /**
   * 四层去重
   */
  async checkDuplicate(
    text: string,
    tenantId: string,
    textHash: string,
  ): Promise<DupCheckResult> {
    // Layer 1.5: 文本内容指纹
    const textDup = await this.candidateRepo
      .createQueryBuilder('c')
      .where('c.textHash = :textHash AND c.tenantId = :tenantId', { textHash, tenantId })
      .getOne();
    if (textDup) {
      return { isDuplicate: true, candidateId: textDup.id, matchField: 'text_hash', confidence: 0.99 };
    }

    return { isDuplicate: false };
  }

  /**
   * 用 LLM 提取的 phone/email 做精确去重
   */
  private async checkDuplicateByProfile(
    profile: any,
    tenantId: string,
  ): Promise<DupCheckResult> {
    const conditions: string[] = [];
    const params: Record<string, string> = { tenantId };

    if (profile.phone) {
      conditions.push('c.phone = :phone');
      params.phone = profile.phone;
    }
    if (profile.email) {
      conditions.push('c.email = :email');
      params.email = profile.email;
    }

    if (conditions.length > 0) {
      const exact = await this.candidateRepo
        .createQueryBuilder('c')
        .where(`(${conditions.join(' OR ')})`)
        .andWhere('c.tenantId = :tenantId')
        .setParameters(params)
        .getOne();

      if (exact) {
        return { isDuplicate: true, candidateId: exact.id, matchField: 'phone_or_email', confidence: 0.95 };
      }
    }

    // Layer 3: 中文模糊匹配
    if (profile.name && profile.currentCompany) {
      const fuzzy = await this.candidateRepo
        .createQueryBuilder('c')
        .where('c.tenantId = :tenantId AND c.name = :name', { tenantId, name: profile.name })
        .andWhere('cn_name_similarity(c.currentCompany, :company) > 0.7', { company: profile.currentCompany })
        .getOne()
        .catch(() => null); // cn_name_similarity may not exist yet

      if (fuzzy) {
        return { isDuplicate: true, candidateId: fuzzy.id, matchField: 'name+company_fuzzy', confidence: 0.7 };
      }
    }

    return { isDuplicate: false };
  }

  /**
   * LLM 结构化抽取
   */
  private async extractStructured(text: string, fileName: string): Promise<any> {
    const prompt = `你是简历信息提取专家。从以下简历文本中提取结构化信息，返回严格 JSON 格式。

要求提取的字段:
- name: 姓名
- gender: 性别 (male/female/unknown)
- phone: 手机号
- email: 邮箱
- age: 年龄 (数字)
- location: 城市
- currentCompany: 当前公司
- currentTitle: 当前职位
- totalYears: 工作年限 (数字)
- degree: 最高学历
- school: 毕业院校
- major: 专业
- workExperiences: 工作经历数组 [{company, title, startDate, endDate, description}]
- projectExperiences: 项目经历数组 [{name, role, description}]
- educationHistory: 教育经历数组 [{school, degree, major, startDate, endDate}]
- skills: 技能标签数组
- summary: 一句话总结

简历文本:
${text.substring(0, 4000)}

返回纯 JSON，不要任何其他文字。`;

    return await this.llmRouter.callForJson('resume', [
      { role: 'system', content: '你是专业简历信息提取系统。只返回 JSON，不添加任何解释。' },
      { role: 'user', content: prompt },
    ]);
  }

  /**
   * 幂等入库 — ON CONFLICT 始终返回 ID
   */
  async upsertByFileHash(dto: any): Promise<{ id: string; isNew: boolean }> {
    // 白名单: 只取 CandidateEntity 实际拥有的字段
    const allowedKeys = new Set([
      'name', 'gender', 'phone', 'email', 'age', 'location',
      'currentCompany', 'currentTitle', 'totalYears', 'degree',
      'school', 'major', 'workExperiences', 'projectExperiences',
      'educationHistory', 'skills', 'summary',
      'tenantId', 'sourcePlatform', 'fileHash', 'textHash', 'resumeText',
    ]);
    const safeDto: Record<string, any> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (allowedKeys.has(key)) {
        safeDto[key] = value;
      }
    }

    const result = await this.candidateRepo
      .createQueryBuilder()
      .insert()
      .values({
        ...safeDto,
        status: 'new',
      })
      .onConflict('("fileHash", "tenantId") DO UPDATE SET "updatedAt" = "updatedAt"')
      .returning(['id', 'createdAt', 'updatedAt'])
      .execute();

    const row = result.raw[0];
    // isNew: createdAt === updatedAt means just inserted
    const isNew = row.created_at
      ? new Date(row.created_at).getTime() === new Date(row.updated_at).getTime()
      : true;

    return { id: row.id, isNew };
  }
}
