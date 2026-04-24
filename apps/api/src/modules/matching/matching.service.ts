import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateEntity } from '../../entities/candidate.entity';
import { JobPositionEntity } from '../../entities/job-position.entity';
import { AiService } from '../ai/ai.service';
import { cosineSimilarity } from '../../common/utils/similarity';

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(CandidateEntity)
    private readonly candidateRepo: Repository<CandidateEntity>,
    @InjectRepository(JobPositionEntity)
    private readonly jobRepo: Repository<JobPositionEntity>,
    private readonly aiService: AiService,
  ) {}

  async findBestMatches(jobId: string, tenantId?: string) {
    const job = await this.jobRepo.findOne({ where: { id: jobId, ...(tenantId ? { tenantId } : {}) } });
    if (!job) throw new NotFoundException('职位不存在');

    if (!job.embedding || job.embedding.length === 0) {
      return [];
    }

    // Phase 1: pgvector HNSW 索引粗筛 (取 Top 100)
    const tenantFilter = tenantId ? 'AND tenant_id = $2' : '';
    const params = [JSON.stringify(job.embedding)];
    if (tenantId) params.push(tenantId);

    const candidates = await this.candidateRepo.query(
      `SELECT *, 1 - (embedding <=> $1::vector) AS semantic_score
       FROM candidates
       WHERE embedding IS NOT NULL ${tenantFilter}
         AND status IN ('new', 'active', 'in_process')
       ORDER BY embedding <=> $1::vector
       LIMIT 100`,
      params,
    );

    // Phase 2: 应用层精排
    const results = candidates.map((candidate: any) => {
      // 2.1 语义相似度
      const semanticScore = parseFloat(candidate.semantic_score) || 0;

      // 2.2 标签匹配度 (Skills)
      const jobSkills = job.skillTags || [];
      const candidateSkills = (candidate.parsed_tags?.skills as string[]) || [];
      const tagMatchScore = this.calculateTagOverlap(jobSkills, candidateSkills);

      // 2.3 经验匹配度 (工作年限 + 行业)
      const expScore = this.calculateExperienceMatch(job, candidate);

      // 2.4 硬性过滤
      const hardMatchMultiplier = this.calculateHardMatch(job, candidate);

      // 2.5 综合得分: 50% 语义 + 30% 标签 + 20% 经验
      const totalScore = (semanticScore * 0.5 + tagMatchScore * 0.3 + expScore * 0.2) * hardMatchMultiplier * 100;

      return {
        candidate,
        score: Math.round(totalScore),
        semanticScore: Math.round(semanticScore * 100),
        tagMatchScore: Math.round(tagMatchScore * 100),
        expScore: Math.round(expScore * 100),
      };
    });

    return results
      .filter((r: any) => r.score > 30)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 20);
  }

  private calculateTagOverlap(tagsA: string[], tagsB: string[]): number {
    if (tagsA.length === 0) return 0;
    const intersection = tagsA.filter((t) =>
      tagsB.some((bt) => bt.toLowerCase().includes(t.toLowerCase())),
    );
    return intersection.length / tagsA.length;
  }

  private calculateExperienceMatch(job: JobPositionEntity, candidate: any): number {
    let score = 0;
    
    // 工作年限匹配
    if (job.salaryMin) { // 借用作为年限参考或者直接用年限
      const requiredYears = 3; // 假设默认 3 年
      const candidateYears = candidate.total_years || 0;
      if (candidateYears >= requiredYears) score += 0.5;
      else score += (candidateYears / requiredYears) * 0.5;
    } else {
      score += 0.5;
    }

    // 行业/职位匹配
    if (job.title && candidate.current_title) {
      if (candidate.current_title.toLowerCase().includes(job.title.toLowerCase())) {
        score += 0.5;
      }
    }

    return score;
  }

  private calculateHardMatch(job: JobPositionEntity, candidate: any): number {
    let multiplier = 1.0;

    // 薪资 Gap 检查
    if (job.salaryMax && candidate.expected_salary) {
      if (candidate.expected_salary > job.salaryMax * 1.5) {
        multiplier *= 0.5;
      }
    }

    return multiplier;
  }

  /**
   * 为单个候选人主动匹配现有岗位
   */
  async findBestMatchesForCandidate(candidateId: string, tenantId?: string) {
    const candidate = await this.candidateRepo.findOne({ where: { id: candidateId, ...(tenantId ? { tenantId } : {}) } });
    if (!candidate || !candidate.embedding) return [];

    // Phase 1: 语义粗筛 (寻找所有匹配的 active 岗位)
    const tenantFilter = tenantId ? 'AND tenant_id = $2' : '';
    const params = [JSON.stringify(candidate.embedding)];
    if (tenantId) params.push(tenantId);

    const jobs = await this.jobRepo.query(
      `SELECT *, 1 - (embedding <=> $1::vector) AS semantic_score
       FROM job_positions
       WHERE embedding IS NOT NULL ${tenantFilter}
         AND status IN ('matching', 'recommending', 'interviewing')
       ORDER BY embedding <=> $1::vector
       LIMIT 50`,
      params,
    );

    // Phase 2: 应用层精排
    const results = jobs.map((job: any) => {
      const semanticScore = parseFloat(job.semantic_score) || 0;
      const jobSkills = job.skill_tags || [];
      const candidateSkills = (candidate.parsedTags?.skills as string[]) || [];
      const tagMatchScore = this.calculateTagOverlap(jobSkills, candidateSkills);
      const expScore = this.calculateExperienceMatch(job, candidate);
      const hardMatchMultiplier = this.calculateHardMatch(job, candidate);

      const totalScore = (semanticScore * 0.5 + tagMatchScore * 0.3 + expScore * 0.2) * hardMatchMultiplier * 100;

      return {
        job,
        score: Math.round(totalScore),
      };
    });

    return results
      .filter((r: any) => r.score > 60) // 只推送高匹配度的
      .sort((a: any, b: any) => b.score - a.score);
  }
}
