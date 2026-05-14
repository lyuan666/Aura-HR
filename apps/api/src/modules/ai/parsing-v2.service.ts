import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { LlmRouterService } from './llm-router.service';
import { PdfExtractionService, ExtractedContent } from './pdf-extraction.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateEntity } from '../../entities/candidate.entity';
import { StorageService } from '../storage/storage.service';
import { SHARED_REDIS } from '../redis/redis.module';

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
    @Inject(SHARED_REDIS)
    private readonly redis: any,
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
    this.enrichCurrentRole(profile);

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
      resumeUrl: data.fileKey,
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
    const textHash = ParsingV2Service.computeTextHash(text);
    const cacheKey = `llm:resume-parse:${textHash}`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (error) {
      this.logger.warn(`读取简历解析缓存失败: ${(error as Error).message}`);
    }

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
- workExperiences: 工作经历数组，每个元素包含:
  {companyName, position, duration(格式"YYYY.MM-YYYY.MM"), description(详细工作内容，用分号分隔多条)}
- projectExperiences: 项目经历数组，每个元素包含:
  {projectName, role, duration, description, achievements}
- educationHistory: 教育经历数组 [{school, degreeLevel, major, duration}]
- careerExpectations: 求职期望 {desiredPosition, desiredLocation(数组), desiredSalary, jobType}
- skills: 技能标签数组
- selfEvaluation: 自我评价（原文提取，保留完整内容）
- summary: 一句话总结

重要规则:
1. workExperiences.description 尽量保留原文的完整描述，不要过度概括
2. projectExperiences 如果简历中有项目经历，必须提取，包括项目描述和业绩
3. selfEvaluation 如果简历中有"自我评价"/"个人评价"/"个人优势"等章节，完整提取
4. careerExpectations 如果简历中有求职意向/期望，提取出来
5. skills 尽量从工作经历和技能栏中提取所有技能关键词

简历文本:
${text.substring(0, 3000)}

返回纯 JSON，不要任何其他文字。`;

    const result = await this.llmRouter.callForJson('resume', [
      { role: 'system', content: '你是专业简历信息提取系统。只返回 JSON，不添加任何解释。' },
      { role: 'user', content: prompt },
    ]);

    // selfEvaluation 存到 parsedTags 避免改表
    if (result.selfEvaluation && !result.parsedTags) {
      result.parsedTags = {};
    }
    if (result.selfEvaluation) {
      result.parsedTags.selfEvaluation = result.selfEvaluation;
      delete result.selfEvaluation;
    }

    // careerExpectations 提到顶层
    if (result.careerExpectations) {
      // keep as is
    }

    try {
      await this.redis.setex(cacheKey, 86400, JSON.stringify(result));
    } catch (error) {
      this.logger.warn(`写入简历解析缓存失败: ${(error as Error).message}`);
    }

    return result;
  }

  private enrichCurrentRole(profile: any) {
    const latestWork = Array.isArray(profile.workExperiences)
      ? profile.workExperiences[0]
      : undefined;

    if (!profile.currentCompany && latestWork?.companyName) {
      profile.currentCompany = latestWork.companyName;
    }
    if (!profile.currentTitle) {
      profile.currentTitle =
        latestWork?.position ||
        profile.careerExpectations?.desiredPosition ||
        undefined;
    }
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
      'educationHistory', 'careerExpectations', 'skills', 'summary',
      'parsedTags',
      'tenantId', 'sourcePlatform', 'fileHash', 'textHash', 'resumeText',
      'resumeUrl',
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
      .onConflict('("file_hash", "tenant_id") DO UPDATE SET "updated_at" = now()')
      .returning(['id', 'created_at', 'updated_at'])
      .execute();

    const row = result.raw[0];
    // isNew: createdAt === updatedAt means just inserted
    const isNew = row.created_at
      ? new Date(row.created_at).getTime() === new Date(row.updated_at).getTime()
      : true;

    return { id: row.id, isNew };
  }
}
