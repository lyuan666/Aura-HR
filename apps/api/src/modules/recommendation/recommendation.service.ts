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
import { EnterpriseEntity } from '../../entities/enterprise.entity';
import { ContractEntity } from '../../entities/contract.entity';
import { AiService } from '../ai/ai.service';
import { CLIENT_RECOMMENDATION_CANDIDATE_FIELDS } from '../client/client-visibility';
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
    @InjectRepository(EnterpriseEntity)
    private enterpriseRepo: Repository<EnterpriseEntity>,
    @InjectRepository(ContractEntity)
    private contractRepo: Repository<ContractEntity>,
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

  async findInterviews(status?: string, tenantId?: string) {
    const qb = this.recommendationRepo
      .createQueryBuilder('r')
      .leftJoin('r.candidate', 'c')
      .leftJoin('r.jobPosition', 'j')
      .select([
        'r.id AS id',
        'c.name AS "candidateName"',
        'j.title AS "jobTitle"',
        'r.interview_date AS "interviewDate"',
        'r.status AS status',
        'r.interview_report AS "interviewReport"',
        'r.created_at AS "createdAt"',
      ]);

    const statuses = ['interview_scheduled', 'interviewed'];
    if (status && statuses.includes(status)) {
      qb.where('r.status = :status', { status });
    } else {
      qb.where('r.status IN (:...statuses)', { statuses });
    }

    if (tenantId) {
      qb.andWhere('r.tenant_id = :tenantId', { tenantId });
    }

    qb.orderBy('r.interview_date', 'ASC');

    return qb.getRawMany();
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

  async findClientRecommendations(
    tenantId: string,
    enterpriseId: string,
    page = 1,
    pageSize = 20,
  ) {
    const [records] = await this.recommendationRepo.findAndCount({
      where: { tenantId },
      order: { updatedAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const items = await this.hydrateClientRecommendations(records, tenantId, enterpriseId);
    return { items, total: items.length, page, pageSize };
  }

  async getClientPortalContext(tenantId: string, enterpriseId: string) {
    const enterprise = await this.enterpriseRepo.findOne({
      where: { id: enterpriseId, tenantId },
    });
    if (!enterprise) throw new NotFoundException('Enterprise not found');

    const contracts = await this.contractRepo.find({
      where: { tenantId, enterpriseId },
      order: { updatedAt: 'DESC' },
    });
    const jobs = await this.jobRepo.find({
      where: { tenantId, enterpriseId },
      order: { updatedAt: 'DESC' },
    });

    const [recommendations] = await this.recommendationRepo.findAndCount({
      where: { tenantId },
      order: { updatedAt: 'DESC' },
    });
    const jobIds = new Set(jobs.map((job) => job.id));
    const scopedRecommendations = recommendations.filter((rec) =>
      jobIds.has(rec.jobPositionId),
    );

    return {
      enterprise: {
        id: enterprise.id,
        name: enterprise.name,
        industry: enterprise.industry,
        scale: enterprise.scale,
        status: enterprise.status,
      },
      contracts: contracts.map((contract) => ({
        id: contract.id,
        contractNo: contract.contractNo,
        title: contract.title,
        status: contract.status,
        startDate: contract.startDate,
        endDate: contract.endDate,
        modules: this.extractContractModules(contract),
      })),
      enabledModules: this.getEnabledModules(contracts),
      stats: this.buildClientStats(scopedRecommendations),
      jobs: jobs.map((job) => ({
        id: job.id,
        title: job.title,
        department: job.department,
        status: job.status,
        headcount: job.headcount,
        location: job.location,
      })),
    };
  }

  async findClientRecommendationDetail(id: string, tenantId: string, enterpriseId: string) {
    const rec = await this.recommendationRepo.findOne({ where: { id, tenantId } });
    if (!rec) throw new NotFoundException('Recommendation not found');
    const [item] = await this.hydrateClientRecommendations([rec], tenantId, enterpriseId);
    if (!item) throw new NotFoundException('Recommendation not found');
    return item;
  }

  async submitClientFeedback(
    id: string,
    tenantId: string,
    enterpriseId: string,
    feedback: string,
  ) {
    const rec = await this.recommendationRepo.findOne({ where: { id, tenantId } });
    if (!rec) throw new NotFoundException('Recommendation not found');
    const job = await this.jobRepo.findOne({
      where: { id: rec.jobPositionId, tenantId, enterpriseId },
    });
    if (!job) throw new NotFoundException('Recommendation not found');
    rec.feedback = feedback;
    const saved = await this.recommendationRepo.save(rec);
    return { success: true, recommendation: this.dehydrate(saved) };
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

  private async hydrateClientRecommendations(
    records: RecommendationEntity[],
    tenantId: string,
    enterpriseId: string,
  ) {
    const items = [];
    for (const rec of records) {
      const job = await this.jobRepo.findOne({
        where: { id: rec.jobPositionId, tenantId, enterpriseId },
      });
      if (!job) continue;
      const candidate = await this.candidateRepo.findOne({
        where: { id: rec.candidateId, tenantId },
      });
      if (!candidate) continue;
      items.push({
        ...this.dehydrate(rec),
        job: {
          id: job.id,
          title: job.title,
          enterpriseId: job.enterpriseId,
        },
        candidate: this.toClientCandidate(candidate),
        visibility: CLIENT_RECOMMENDATION_CANDIDATE_FIELDS.authenticatedClient,
      });
    }
    return items;
  }

  private toClientCandidate(candidate: CandidateEntity) {
    const parsedTags = candidate.parsedTags || {};
    return {
      displayName: candidate.name ? `${candidate.name.charAt(0)}*` : '候选人',
      currentTitle: candidate.currentTitle,
      currentCompany: candidate.currentCompany,
      totalYears: candidate.totalYears,
      degree: candidate.degree,
      school: candidate.school,
      skills: Array.isArray((parsedTags as any).skills) ? (parsedTags as any).skills : [],
      workExperiencesSummary: this.summarizeList(candidate.workExperiences),
      projectExperiencesSummary: this.summarizeList(candidate.projectExperiences),
    };
  }

  private summarizeList(items?: any[]) {
    return Array.isArray(items) ? items.slice(0, 3) : [];
  }

  private extractContractModules(contract: ContractEntity) {
    const parsed = this.parseContractNotes(contract.notes);
    if (Array.isArray(parsed.modules)) {
      return parsed.modules.filter((module) => typeof module === 'string');
    }
    if (contract.status === 'active') {
      return ['recommendations', 'feedback'];
    }
    return [];
  }

  private getEnabledModules(contracts: ContractEntity[]) {
    const modules = new Set<string>();
    for (const contract of contracts) {
      for (const module of this.extractContractModules(contract)) {
        modules.add(module);
      }
    }
    return Array.from(modules);
  }

  private parseContractNotes(notes?: string) {
    if (!notes) return {} as { modules?: unknown };
    try {
      return JSON.parse(notes) as { modules?: unknown };
    } catch {
      return {} as { modules?: unknown };
    }
  }

  private buildClientStats(recommendations: RecommendationEntity[]) {
    const countStatus = (status: string) =>
      recommendations.filter((rec) => rec.status === status).length;

    return {
      totalRecommendations: recommendations.length,
      submitted: countStatus('submitted'),
      reviewing: countStatus('reviewing'),
      interviewScheduled: countStatus('interview_scheduled'),
      accepted: countStatus('accepted'),
      rejected: countStatus('rejected'),
    };
  }
}
