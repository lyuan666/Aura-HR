import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecommendationEntity } from '../../entities/recommendation.entity';
import { CandidateEntity } from '../../entities/candidate.entity';
import { JobPositionEntity } from '../../entities/job-position.entity';
import { AiService } from '../ai/ai.service';
import {
  StateMachine,
  RECOMMENDATION_TRANSITIONS,
} from '../../common/utils/state-machine';

@Injectable()
export class RecommendationService {
  private readonly stateMachine = new StateMachine(RECOMMENDATION_TRANSITIONS);

  constructor(
    @InjectRepository(RecommendationEntity)
    private recommendationRepo: Repository<RecommendationEntity>,
    @InjectRepository(CandidateEntity)
    private candidateRepo: Repository<CandidateEntity>,
    @InjectRepository(JobPositionEntity)
    private jobRepo: Repository<JobPositionEntity>,
    private aiService: AiService,
  ) {}

  async createRecommendation(
    candidateId: string,
    jobId: string,
    consultantId: string,
    tenantId?: string,
  ) {
    if (!consultantId) {
      throw new BadRequestException('缺少顾问信息，无法创建推荐');
    }

    const candidate = await this.candidateRepo.findOne({
      where: { id: candidateId, ...(tenantId ? { tenantId } : {}) },
    });
    if (!candidate) throw new NotFoundException('Candidate not found');

    const job = await this.jobRepo.findOne({
      where: { id: jobId, ...(tenantId ? { tenantId } : {}) },
    });
    if (!job) throw new NotFoundException('Job not found');

    // 检查是否已存在
    const existing = await this.recommendationRepo.findOne({
      where: {
        candidateId,
        jobPositionId: jobId,
        ...(tenantId ? { tenantId } : {}),
      },
    });
    if (existing) return this.dehydrate(existing);

    const recommendation = this.recommendationRepo.create({
      candidateId,
      jobPositionId: jobId,
      consultantId,
      tenantId,
      status: 'pending',
    });

    const saved = await this.recommendationRepo.save(recommendation);
    return this.dehydrate(saved);
  }

  private dehydrate(r: RecommendationEntity) {
    return {
      id: r.id,
      candidateId: r.candidateId,
      jobPositionId: r.jobPositionId,
      consultantId: r.consultantId,
      status: r.status,
      matchScore: r.matchScore,
      aiAnalysis: r.aiAnalysis,
      interviewDate: r.interviewDate,
      interviewReport: r.interviewReport,
      tenantId: r.tenantId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  async getMatchReport(recommendationId: string, tenantId?: string) {
    const rec = await this.recommendationRepo.findOne({
      where: { id: recommendationId, ...(tenantId ? { tenantId } : {}) },
    });
    if (!rec) throw new NotFoundException('Recommendation not found');

    if (rec.aiAnalysis && rec.matchScore)
      return { analysis: rec.aiAnalysis, score: rec.matchScore };

    const candidate = await this.candidateRepo.findOne({
      where: { id: rec.candidateId, ...(tenantId ? { tenantId } : {}) },
    });
    const job = await this.jobRepo.findOne({
      where: { id: rec.jobPositionId, ...(tenantId ? { tenantId } : {}) },
    });

    if (!candidate || !job)
      throw new NotFoundException('Candidate or Job not found');

    // 构造画像：基于已解析的结构化数据或原始文本
    const candidateProfile = candidate.parsedTags || {
      resumeText: candidate.resumeText,
    };
    const jobProfile = { title: job.title, description: job.description };

    const analysisResult: any = await this.aiService.generateMatchingReport(
      candidateProfile,
      jobProfile,
    );

    rec.aiAnalysis = analysisResult as any;
    rec.matchScore = analysisResult.score;
    await this.recommendationRepo.save(rec);

    return analysisResult;
  }

  async createInterviewReport(
    recommendationId: string,
    interviewText: string,
    tenantId?: string,
  ) {
    const rec = await this.recommendationRepo.findOne({
      where: { id: recommendationId, ...(tenantId ? { tenantId } : {}) },
    });
    if (!rec) throw new NotFoundException('Recommendation not found');

    const report = await this.aiService.generateInterviewReport(interviewText);

    rec.interviewReport = report;
    this.stateMachine.validateTransition(rec.status, 'interviewed');
    rec.status = 'interviewed';
    await this.recommendationRepo.save(rec);

    return report;
  }

  async findAll(page = 1, pageSize = 20, tenantId?: string) {
    const [items, total] = await this.recommendationRepo.findAndCount({
      where: tenantId ? { tenantId } : {},
      order: { updatedAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: items.map((r) => this.dehydrate(r)),
      total,
      page,
      pageSize,
    };
  }

  async updateStatus(id: string, status: string, tenantId?: string) {
    const rec = await this.recommendationRepo.findOne({
      where: { id, ...(tenantId ? { tenantId } : {}) },
    });
    if (!rec) throw new NotFoundException('Recommendation not found');

    // 状态机验证
    this.stateMachine.validateTransition(rec.status, status);

    rec.status = status;
    const updated = await this.recommendationRepo.save(rec);
    return this.dehydrate(updated);
  }

  async updateSchedule(id: string, date: Date | string, tenantId?: string) {
    const rec = await this.recommendationRepo.findOne({
      where: { id, ...(tenantId ? { tenantId } : {}) },
    });
    if (!rec) throw new NotFoundException('Recommendation not found');

    rec.interviewDate = new Date(date);
    const updated = await this.recommendationRepo.save(rec);
    return this.dehydrate(updated);
  }

  async getOutreachMessage(id: string, tenantId?: string) {
    const rec = await this.recommendationRepo.findOne({
      where: { id, ...(tenantId ? { tenantId } : {}) },
    });
    if (!rec) throw new NotFoundException('Recommendation not found');

    const candidate = await this.candidateRepo.findOne({
      where: { id: rec.candidateId, ...(tenantId ? { tenantId } : {}) },
    });
    const job = await this.jobRepo.findOne({
      where: { id: rec.jobPositionId, ...(tenantId ? { tenantId } : {}) },
    });

    if (!candidate || !job)
      throw new NotFoundException('Candidate or Job not found');

    return this.aiService.generateOutreachMessage(
      candidate.resumeText || '',
      job.title,
      job.description || '',
    );
  }
}
