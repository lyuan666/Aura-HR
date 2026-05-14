import { Injectable } from '@nestjs/common';
import { ParsingV2Service } from '../ai/parsing-v2.service';

export interface QualityInput {
  name?: string | null;
  phone?: string | null;
  normalizedPhone?: string | null;
  email?: string | null;
  normalizedEmail?: string | null;
  resumeText?: string | null;
  currentCompany?: string | null;
  currentTitle?: string | null;
  sourceUrl?: string | null;
  sourceRecordId?: string | null;
}

export interface QualityScoreResult {
  score: number;
  reasons: string[];
  decision: 'reject' | 'review' | 'candidate';
}

@Injectable()
export class ImportQualityService {
  normalizePhone(value?: string | null): string | null {
    const normalized = value?.replace(/\D/g, '') || '';
    return normalized || null;
  }

  normalizeEmail(value?: string | null): string | null {
    const normalized = value?.trim().toLowerCase() || '';
    return normalized || null;
  }

  computeTextHash(value?: string | null): string | null {
    if (!value) return null;
    return ParsingV2Service.computeTextHash(value);
  }

  score(input: QualityInput): QualityScoreResult {
    let score = 0;
    const reasons: string[] = [];
    const hasPhone = Boolean(input.normalizedPhone || input.phone);
    const hasEmail = Boolean(input.normalizedEmail || input.email);
    const resumeLength = input.resumeText?.length || 0;

    if (hasPhone || hasEmail) {
      score += 25;
      reasons.push('contact');
    }
    if (hasPhone && hasEmail) {
      score += 5;
      reasons.push('phone_email');
    }
    if (resumeLength >= 500) {
      score += 15;
      reasons.push('resume_500');
    }
    if (resumeLength >= 2000) {
      score += 10;
      reasons.push('resume_2000');
    }
    if (input.currentCompany) {
      score += 10;
      reasons.push('company');
    }
    if (input.currentTitle) {
      score += 10;
      reasons.push('title');
    }
    if (input.name) {
      score += 10;
      reasons.push('name');
    }
    if (input.sourceUrl || input.sourceRecordId) {
      score += 5;
      reasons.push('source');
    }

    const decision = score >= 65 ? 'candidate' : score >= 35 ? 'review' : 'reject';
    return { score, reasons, decision };
  }
}
