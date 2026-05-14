import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateEntity } from '../../entities/candidate.entity';

export type CandidateDedupeMatchType =
  | 'phone'
  | 'email'
  | 'text_hash'
  | 'file_hash'
  | 'name_source'
  | 'name_company';

export type CandidateDedupeResult =
  | {
      status: 'duplicate';
      candidateId: string;
      matchType: CandidateDedupeMatchType;
      confidence: number;
      candidate?: CandidateEntity;
    }
  | { status: 'unique' };

export interface CandidateDedupeInput {
  tenantId?: string;
  normalizedPhone?: string | null;
  normalizedEmail?: string | null;
  textHash?: string | null;
  fileHash?: string | null;
  name?: string | null;
  currentCompany?: string | null;
  sourcePlatform?: string | null;
}

@Injectable()
export class CandidateDedupeService {
  constructor(
    @InjectRepository(CandidateEntity)
    private readonly candidateRepo: Repository<CandidateEntity>,
  ) {}

  async findDuplicate(input: CandidateDedupeInput): Promise<CandidateDedupeResult> {
    const matchers: Array<{
      value: unknown;
      matchType: CandidateDedupeMatchType;
      confidence: number;
      where: Record<string, unknown>;
    }> = [
      {
        value: input.normalizedPhone,
        matchType: 'phone',
        confidence: 0.98,
        where: { phone: input.normalizedPhone },
      },
      {
        value: input.normalizedEmail,
        matchType: 'email',
        confidence: 0.98,
        where: { email: input.normalizedEmail },
      },
      {
        value: input.textHash,
        matchType: 'text_hash',
        confidence: 0.99,
        where: { textHash: input.textHash },
      },
      {
        value: input.fileHash,
        matchType: 'file_hash',
        confidence: 0.99,
        where: { fileHash: input.fileHash },
      },
      {
        value: input.sourcePlatform && input.name,
        matchType: 'name_source',
        confidence: 0.8,
        where: { sourcePlatform: input.sourcePlatform, name: input.name },
      },
      {
        value: input.currentCompany && input.name,
        matchType: 'name_company',
        confidence: 0.75,
        where: { currentCompany: input.currentCompany, name: input.name },
      },
    ];

    for (const matcher of matchers) {
      if (!matcher.value) continue;
      const candidate = await this.candidateRepo.findOne({
        where: this.withTenant(matcher.where, input.tenantId) as any,
      });
      if (candidate) {
        return {
          status: 'duplicate',
          candidateId: candidate.id,
          matchType: matcher.matchType,
          confidence: matcher.confidence,
          candidate,
        };
      }
    }

    return { status: 'unique' };
  }

  private withTenant(where: Record<string, unknown>, tenantId?: string) {
    return tenantId ? { ...where, tenantId } : where;
  }
}
