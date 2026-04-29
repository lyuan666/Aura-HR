import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JobPositionEntity } from '../../entities/job-position.entity';
import { CreateJobDto, UpdateJobDto } from './job.dto';
import { AiService } from '../ai/ai.service';
import { EmbeddingService } from '../embedding/embedding.service';
import { StateMachine, JOB_TRANSITIONS } from '../../common/utils/state-machine';

@Injectable()
export class JobService {
  private readonly stateMachine = new StateMachine(JOB_TRANSITIONS);



  constructor(
    @InjectRepository(JobPositionEntity)
    private readonly jobRepo: Repository<JobPositionEntity>,
    private readonly aiService: AiService,
    private readonly embeddingService: EmbeddingService,
    @InjectQueue('job-enhance') private readonly jobEnhanceQueue: Queue,
  ) {}

  async create(dto: CreateJobDto, tenantId?: string) {
    let enterpriseId = dto.enterpriseId;

    // 自动兜底：如果未传入企业 ID，尝试获取数据库中该租户的第一个企业
    if (!enterpriseId) {
      const firstEnt = await this.jobRepo.manager.getRepository('EnterpriseEntity').findOne({ 
        where: tenantId ? { tenantId } : {} 
      });
      if (firstEnt) {
        enterpriseId = (firstEnt as any).id;
      } else {
        // 无企业数据时，创建一个租户隔离的演示企业
        const newEnt = this.jobRepo.manager.getRepository('EnterpriseEntity').create({
          name: '默认测试客户 (演示中)',
          industry: '互联网',
          status: 'potential',
          tenantId,
        });
        const savedEnt = await this.jobRepo.manager.getRepository('EnterpriseEntity').save(newEnt);
        enterpriseId = (savedEnt as any).id;
      }
    }

    // 1. 创建基础数据
    const job = this.jobRepo.create({
      ...dto,
      enterpriseId,
      tenantId,
      status: 'pending',
    });
    const savedJob = await this.jobRepo.save(job);

    // 2. 触发异步 AI 增强 (BullMQ)
    await this.jobEnhanceQueue.add(
      'job-enhance',
      { jobId: savedJob.id, description: dto.description || '' },
      { jobId: `enhance-${savedJob.id}`, removeOnComplete: { count: 100 } },
    );

    return this.dehydrate(savedJob);
  }

  private dehydrate(j: JobPositionEntity) {
    return {
      id: j.id,
      title: j.title,
      enterpriseId: j.enterpriseId,
      salaryMin: j.salaryMin,
      salaryMax: j.salaryMax,
      location: j.location,
      headcount: j.headcount,
      urgency: j.urgency,
      description: j.description,
      requirements: j.requirements,
      enhancedDescription: j.enhancedDescription,
      skillTags: j.skillTags,
      status: j.status,
      tenantId: j.tenantId,
      createdAt: j.createdAt,
      updatedAt: j.updatedAt,
    };
  }

  async findAll(page = 1, pageSize = 20, tenantId?: string) {
    const [items, total] = await this.jobRepo.findAndCount({
      where: tenantId ? { tenantId } : {},
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return {
      items: items.map((j) => this.dehydrate(j)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string, tenantId?: string) {
    const job = await this.jobRepo.findOne({ 
      where: { id, ...(tenantId ? { tenantId } : {}) } 
    });
    if (!job) throw new NotFoundException('职位不存在');
    return this.dehydrate(job);
  }

  async update(id: string, dto: UpdateJobDto, tenantId?: string) {
    const jobEntity = await this.jobRepo.findOne({ 
      where: { id, ...(tenantId ? { tenantId } : {}) } 
    });
    if (!jobEntity) throw new NotFoundException('职位不存在');

    if (dto.status && dto.status !== jobEntity.status) {
      this.stateMachine.validateTransition(jobEntity.status, dto.status);
    }
    const updated = this.jobRepo.merge(jobEntity, dto);
    const saved = await this.jobRepo.save(updated);
    return this.dehydrate(saved);
  }

  public async enhanceJobAsync(jobId: string, description: string) {
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
