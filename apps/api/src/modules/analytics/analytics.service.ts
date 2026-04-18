import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateEntity } from '../../entities/candidate.entity';
import { JobPositionEntity } from '../../entities/job-position.entity';
import { RecommendationEntity } from '../../entities/recommendation.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(CandidateEntity)
    private readonly candidateRepo: Repository<CandidateEntity>,
    @InjectRepository(JobPositionEntity)
    private readonly jobRepo: Repository<JobPositionEntity>,
    @InjectRepository(RecommendationEntity)
    private readonly recRepo: Repository<RecommendationEntity>,
  ) {}

  async getOverview() {
    const [candidateCount, jobCount, recommendationCount, acceptedCount] = await Promise.all([
      this.candidateRepo.count(),
      this.jobRepo.count(),
      this.recRepo.count(),
      this.recRepo.count({ where: { status: 'accepted' } }),
    ]);

    return {
      candidateCount,
      jobCount,
      recommendationCount,
      acceptedCount,
    };
  }

  async getTalentStats() {
    // 聚合技能标签分布
    const candidates = await this.candidateRepo.find({ select: ['parsedTags'] });
    const skillMap: Record<string, number> = {};

    candidates.forEach(c => {
      const skills = (c.parsedTags as any)?.skills || [];
      skills.forEach((skill: string) => {
        skillMap[skill] = (skillMap[skill] || 0) + 1;
      });
    });

    const sortedSkills = Object.entries(skillMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));

    return sortedSkills;
  }

  async getDeliveryFunnel() {
    const stats = await this.recRepo
      .createQueryBuilder('rec')
      .select('rec.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('rec.status')
      .getRawMany();

    // 格式化为有序漏斗
    const order = ['pending', 'submitted', 'reviewing', 'interview_scheduled', 'offer_sent', 'accepted'];
    const funnel = order.map(status => {
      const found = stats.find(s => s.status === status);
      return {
        name: this.getStatusLabel(status),
        value: found ? parseInt(found.count) : 0,
      };
    });

    return funnel;
  }

  private getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      pending: '待筛选',
      submitted: '已推荐',
      reviewing: '企业评估',
      interview_scheduled: '已约面',
      offer_sent: '已发 Offer',
      accepted: '已入职',
    };
    return labels[status] || status;
  }
}
