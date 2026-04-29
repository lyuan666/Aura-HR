import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ShareLinkEntity } from '../../entities/share-link.entity';
import { RecommendationEntity } from '../../entities/recommendation.entity';
import { CandidateEntity } from '../../entities/candidate.entity';
import { JobPositionEntity } from '../../entities/job-position.entity';
import { nanoid } from 'nanoid';

@Injectable()
export class ShareService {
  constructor(
    @InjectRepository(ShareLinkEntity)
    private shareRepo: Repository<ShareLinkEntity>,
    @InjectRepository(RecommendationEntity)
    private recommendationRepo: Repository<RecommendationEntity>,
    @InjectRepository(CandidateEntity)
    private candidateRepo: Repository<CandidateEntity>,
    @InjectRepository(JobPositionEntity)
    private jobRepo: Repository<JobPositionEntity>,
  ) {}

  async createShareLink(recommendationId: string, tenantId?: string, isAnonymized = true) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 默认 7 天有效期

    const shareLink = this.shareRepo.create({
      token: nanoid(12),
      recommendationId,
      tenantId,
      expiresAt,
      isAnonymized,
    });

    return this.shareRepo.save(shareLink);
  }

  async getShareData(token: string) {
    const link = await this.shareRepo.findOne({
      where: { 
        token, 
        expiresAt: MoreThan(new Date()) 
      },
    });

    if (!link) throw new NotFoundException('分享链接无效或已过期');

    const rec = await this.recommendationRepo.findOne({ where: { id: link.recommendationId } });
    if (!rec) throw new NotFoundException('找不到对应的推荐记录');

    const candidate = await this.candidateRepo.findOne({ where: { id: rec.candidateId } });
    const job = await this.jobRepo.findOne({ where: { id: rec.jobPositionId } });

    if (!candidate || !job) throw new NotFoundException('数据不完整');

    // 增加访问计数
    link.viewCount += 1;
    await this.shareRepo.save(link);

    // 脱敏处理
    let profile = {
      name: candidate.name,
      avatar: (candidate as any).avatar,
      yearsOfExperience: (candidate as any).parsedTags?.yearsOfExperience,
      education: (candidate as any).parsedTags?.education,
      skills: (candidate as any).parsedTags?.skills || [],
      experience: (candidate as any).experience || [],
    };

    if (link.isAnonymized) {
      profile.name = `${candidate.name.charAt(0)}* (${job.title.includes('经理') ? '某经理' : '某资深专家'})`;
      // 此处可以进一步处理简历中的公司名称脱敏
    }

    return {
      profile,
      job: {
        title: job.title,
        company: job.enterpriseId, // 这里可以换成企业名称，但外部分享通常只需职位名
      },
      aiAnalysis: rec.aiAnalysis,
      status: rec.status,
      linkStatus: {
        expiresAt: link.expiresAt,
        viewCount: link.viewCount,
      }
    };
  }

  async submitFeedback(token: string, feedback: string) {
    const link = await this.shareRepo.findOne({ where: { token } });
    if (!link) throw new NotFoundException('链接无效');

    link.feedback = feedback;
    await this.shareRepo.save(link);

    // 同步更新推荐记录的状态（可选）
    if (feedback.includes('约面') || feedback.includes('面试')) {
      await this.recommendationRepo.update(link.recommendationId, { status: 'interview_scheduled' });
    }

    return { success: true };
  }
}
