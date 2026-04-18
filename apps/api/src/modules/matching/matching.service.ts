import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateEntity } from '../../entities/candidate.entity';
import { JobPositionEntity } from '../../entities/job-position.entity';
import { AiService } from '../ai/ai.service';

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(CandidateEntity)
    private readonly candidateRepo: Repository<CandidateEntity>,
    @InjectRepository(JobPositionEntity)
    private readonly jobRepo: Repository<JobPositionEntity>,
    private readonly aiService: AiService,
  ) {}

  async findBestMatches(jobId: string) {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('职位不存在');

    // 1. 获取所有有向量的候选人 (如果 pgvector 可用, 这里可以用 SQL 优化)
    // 这里实现一个退化方案: 查出 top 200 候选人并在内存计算相似度
    const candidates = await this.candidateRepo.find({
      order: { lastContactedAt: 'DESC' },
      take: 200,
    });

    const results = candidates.map((candidate) => {
      // 1.1 语义相似度 (余弦相似度)
      let semanticScore = 0;
      if (job.embedding && candidate.embedding) {
        semanticScore = this.cosineSimilarity(job.embedding, candidate.embedding);
      }

      // 1.2 标签匹配度 (Skills)
      const jobSkills = job.skillTags || [];
      const candidateSkills = (candidate.parsedTags?.skills as string[]) || [];
      const tagMatchScore = this.calculateTagOverlap(jobSkills, candidateSkills);

      // 1.3 硬性过滤 (加权影响, 而非直接剔除, 除非差异巨大)
      let hardMatchMultiplier = 1.0;
      if (job.salaryMin && candidate.expectedSalary && candidate.expectedSalary > job.salaryMax * 1.5) {
        hardMatchMultiplier = 0.5; // 期望薪资远超预算, 降权
      }

      // 1.4 综合得分
      const totalScore = (semanticScore * 0.6 + tagMatchScore * 0.3 + 0.1) * hardMatchMultiplier * 100;

      return {
        candidate,
        score: Math.round(totalScore),
        semanticScore: Math.round(semanticScore * 100),
        tagMatchScore: Math.round(tagMatchScore * 100),
      };
    });

    // 过滤掉得分太低的并排序
    return results
      .filter((r) => r.score > 30)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    if (!magA || !magB) return 0;
    return dotProduct / (magA * magB);
  }

  private calculateTagOverlap(tagsA: string[], tagsB: string[]): number {
    if (tagsA.length === 0) return 0;
    const intersection = tagsA.filter((t) =>
      tagsB.some((bt) => bt.toLowerCase().includes(t.toLowerCase())),
    );
    return intersection.length / tagsA.length;
  }
}
