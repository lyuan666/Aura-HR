import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobPositionEntity } from '../../entities/job-position.entity';
import { RecommendationEntity } from '../../entities/recommendation.entity';

@Injectable()
export class ClientPortalService {
  private readonly logger = new Logger(ClientPortalService.name);

  constructor(
    @InjectRepository(JobPositionEntity)
    private readonly jobRepo: Repository<JobPositionEntity>,
    @InjectRepository(RecommendationEntity)
    private readonly recommendationRepo: Repository<RecommendationEntity>,
  ) {}

  /**
   * 获取客户所属企业的所有职位
   */
  async getEnterpriseJobs(enterpriseId: string) {
    return await this.jobRepo.find({
      where: { enterpriseId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 客户创建职位需求
   */
  async createEnterpriseJob(enterpriseId: string, tenantId: string, data: any) {
    const job = this.jobRepo.create({
      ...data,
      enterpriseId,
      tenantId,
      status: 'active', // 默认激活
    });
    return await this.jobRepo.save(job);
  }

  /**
   * 获取客户所属企业的所有推荐记录（包含候选人简要信息）
   */
  async getEnterpriseRecommendations(enterpriseId: string) {
    return await this.recommendationRepo.find({
      where: { jobPosition: { enterpriseId } },
      relations: ['candidate', 'jobPosition'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 客户更新推荐状态（如：约面试、淘汰）
   */
  async updateRecommendationStatus(enterpriseId: string, recommendationId: string, status: string) {
    const rec = await this.recommendationRepo.findOne({
      where: { id: recommendationId, jobPosition: { enterpriseId } },
    });

    if (!rec) {
      throw new Error('未找到该推荐记录或无权操作');
    }

    rec.status = status;
    return await this.recommendationRepo.save(rec);
  }
}
