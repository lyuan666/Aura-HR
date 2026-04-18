import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecommendationEntity } from '../../entities/recommendation.entity';
import { CandidateEntity } from '../../entities/candidate.entity';
import { JobPositionEntity } from '../../entities/job-position.entity';
import { AiService } from '../ai/ai.service';

@Injectable()
export class RecommendationService {
  constructor(
    @InjectRepository(RecommendationEntity)
    private recommendationRepo: Repository<RecommendationEntity>,
    @InjectRepository(CandidateEntity)
    private candidateRepo: Repository<CandidateEntity>,
    @InjectRepository(JobPositionEntity)
    private jobRepo: Repository<JobPositionEntity>,
    private aiService: AiService,
  ) {}

  async createRecommendation(candidateId: string, jobId: string) {
    // 检查是否已存在
    const existing = await this.recommendationRepo.findOne({
      where: { candidateId, jobPositionId: jobId },
    });
    if (existing) return existing;

    const recommendation = this.recommendationRepo.create({
      candidateId,
      jobPositionId: jobId,
      status: 'pending',
    });

    return this.recommendationRepo.save(recommendation);
  }

  async getMatchReport(recommendationId: string) {
    const rec = await this.recommendationRepo.findOne({ where: { id: recommendationId } });
    if (!rec) throw new NotFoundException('Recommendation not found');

    if (rec.aiAnalysis && rec.matchScore) return { analysis: rec.aiAnalysis, score: rec.matchScore };

    const candidate = await this.candidateRepo.findOne({ where: { id: rec.candidateId } });
    const job = await this.jobRepo.findOne({ where: { id: rec.jobPositionId } });

    if (!candidate || !job) throw new NotFoundException('Candidate or Job not found');

    // 构造画像：基于已解析的结构化数据或原始文本
    const candidateProfile = candidate.parsedTags || { resumeText: candidate.resumeText };
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

  async createInterviewReport(recommendationId: string, interviewText: string) {
    const rec = await this.recommendationRepo.findOne({ where: { id: recommendationId } });
    if (!rec) throw new NotFoundException('Recommendation not found');

    const report = await this.aiService.generateInterviewReport(interviewText);
    
    rec.interviewReport = report;
    rec.status = 'interviewed';
    await this.recommendationRepo.save(rec);

    return report;
  }

  async findAll() {
    // 这里简单返回，后续可能需要复杂 Join
    return this.recommendationRepo.find({
      order: { updatedAt: 'DESC' },
    });
  }

  async updateStatus(id: string, status: string) {
    await this.recommendationRepo.update(id, { status });
    return this.recommendationRepo.findOne({ where: { id } });
  }

  async updateSchedule(id: string, date: Date) {
    await this.recommendationRepo.update(id, { interviewDate: date });
    return this.recommendationRepo.findOne({ where: { id } });
  }

  async getOutreachMessage(id: string) {
    const rec = await this.recommendationRepo.findOne({ where: { id } });
    if (!rec) throw new NotFoundException('Recommendation not found');

    const candidate = await this.candidateRepo.findOne({ where: { id: rec.candidateId } });
    const job = await this.jobRepo.findOne({ where: { id: rec.jobPositionId } });

    if (!candidate || !job) throw new NotFoundException('Candidate or Job not found');

    return this.aiService.generateOutreachMessage(
      candidate.resumeText || '',
      job.title,
      job.description || '',
    );
  }
}
