import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobPositionEntity } from '../../entities/job-position.entity';
import { CreateJobDto, UpdateJobDto } from './job.dto';
import { AiService } from '../ai/ai.service';
import { EmbeddingService } from '../embedding/embedding.service';

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(JobPositionEntity)
    private readonly jobRepo: Repository<JobPositionEntity>,
    private readonly aiService: AiService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async create(dto: CreateJobDto) {
    let enterpriseId = dto.enterpriseId;

    // 自动兜底：如果未传入企业 ID，尝试获取数据库中第一个企业，若无则创建一个演示企业
    if (!enterpriseId) {
      console.log('--- 触发职位发布企业 ID 自动兜底 ---');
      const firstEnt = await this.jobRepo.manager.getRepository('EnterpriseEntity').findOne({ where: {} });
      if (firstEnt) {
        enterpriseId = (firstEnt as any).id;
      } else {
        // 无企业数据时，创建一个演示企业
        const newEnt = this.jobRepo.manager.getRepository('EnterpriseEntity').create({
          name: '默认测试客户 (演示中)',
          industry: '互联网',
          status: 'potential'
        });
        const savedEnt = await this.jobRepo.manager.getRepository('EnterpriseEntity').save(newEnt);
        enterpriseId = (savedEnt as any).id;
      }
    }

    // 1. 创建基础数据
    const job = this.jobRepo.create({
      ...dto,
      enterpriseId,
      status: 'pending',
    });
    const savedJob = await this.jobRepo.save(job);

    // 2. 触发异步 AI 增强 (不阻塞主流转)
    this.enhanceJobAsync(savedJob.id, dto.description || '');

    return savedJob;
  }

  async findAll() {
    return this.jobRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const job = await this.jobRepo.findOne({ where: { id } });
    if (!job) throw new NotFoundException('职位不存在');
    return job;
  }

  async update(id: string, dto: UpdateJobDto) {
    const job = await this.findOne(id);
    const updated = this.jobRepo.merge(job, dto);
    return this.jobRepo.save(updated);
  }

  private async enhanceJobAsync(jobId: string, description: string) {
    try {
      // AI 解析
      const parsed = await this.aiService.parseJobDescription(description);
      if (!parsed) return;

      const job = await this.jobRepo.findOne({ where: { id: jobId } });
      if (!job) return;

      // 更新结构化字段
      job.title = (parsed.title as string) || job.title;
      job.salaryMin = (parsed.salaryMin as number) || job.salaryMin;
      job.salaryMax = (parsed.salaryMax as number) || job.salaryMax;
      job.skillTags = (parsed.requiredSkills as string[]) || job.skillTags;
      job.enhancedDescription = (parsed.summary as string) || job.description;

      // 生成向量 (使用 summary 作为语义核心)
      const embedding = await this.embeddingService.generateEmbedding(job.enhancedDescription);
      if (embedding) {
        job.embedding = embedding;
        job.status = 'matching'; // 向量准备好后进入匹配状态
      }

      await this.jobRepo.save(job);
      console.log(`Job ${jobId} enhanced successfully.`);
    } catch (e) {
      console.error(`Failed to enhance job ${jobId}:`, e);
    }
  }
}
