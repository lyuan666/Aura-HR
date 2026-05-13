import { Injectable } from '@nestjs/common';
import { ParsingService } from './parsing.service';
import { InsightService } from './insight.service';
import { LlmClientService } from './llm-client.service';

export interface EnterpriseEnrichmentInput {
  industry?: string;
  scale?: string;
  description?: string;
  website?: string;
}

export interface EnterpriseEnrichmentResult {
  industry?: string;
  scale?: string;
  description?: string;
  website?: string;
}

@Injectable()
export class AiService {
  constructor(
    private readonly parsingService: ParsingService,
    private readonly insightService: InsightService,
    private readonly llmClient: LlmClientService,
  ) {}

  async parseResume(textContent: string) {
    return this.llmClient.callAi(
      [
        {
          role: 'system',
          content: '提取简历 JSON：basicInfo, workExperience, education。',
        },
        { role: 'user', content: textContent.slice(0, 6000) },
      ],
      true,
    );
  }

  async parseFile(buffer: Buffer, originalName: string, type: 'resume' | 'jd') {
    if (type === 'resume') {
      return this.parsingService.parseResumeFast(buffer, originalName);
    }
    return this.parsingService.parseJobDescription(buffer.toString('utf-8'));
  }

  async parseResumeFast(buffer: Buffer, originalName: string) {
    return this.parsingService.parseResumeFast(buffer, originalName);
  }

  async parseJobDescription(textContent: string) {
    return this.parsingService.parseJobDescription(textContent);
  }

  async generateMatchingReport(candidateProfile: any, jobProfile: any) {
    return this.insightService.generateMatchingReport(
      candidateProfile,
      jobProfile,
    );
  }

  async generateInterviewReport(interviewText: string) {
    return this.insightService.generateInterviewReport(interviewText);
  }

  async generateOutreachMessage(
    resumeText: string,
    jobTitle: string,
    jobDescription: string,
  ) {
    return this.insightService.generateOutreachMessage(
      resumeText,
      jobTitle,
      jobDescription,
    );
  }

  async generateJobDescription(
    info: string,
    responsibilities: string,
    skills: string,
  ) {
    return this.insightService.generateJobDescription(
      info,
      responsibilities,
      skills,
    );
  }

  async generateFollowUpStrategy(context: string, targetType: string) {
    return this.insightService.generateFollowUpStrategy(context, targetType);
  }

  async normalizeEnterpriseName(rawName: string): Promise<string> {
    const trimmedName = rawName.trim();
    if (!trimmedName) return rawName;

    const result = await this.llmClient.callAi(
      [
        {
          role: 'system',
          content:
            '你是企业主数据清洗助手。将输入企业名规范化为常见工商全称；无法判断时返回原名。只输出 JSON: {"name":"规范企业名"}',
        },
        { role: 'user', content: trimmedName },
      ],
      true,
    );

    if (typeof result === 'string') {
      return result.trim() || trimmedName;
    }

    const name = (result as { name?: unknown })?.name;
    return typeof name === 'string' && name.trim() ? name.trim() : trimmedName;
  }

  async enrichEnterpriseInfo(
    name: string,
    current: EnterpriseEnrichmentInput,
  ): Promise<EnterpriseEnrichmentResult> {
    const result = await this.llmClient.callAi(
      [
        {
          role: 'system',
          content:
            '你是猎头 CRM 企业资料补全助手。根据企业名称和已有资料补全行业、规模、简介、官网。只输出 JSON: {"industry":"","scale":"","description":"","website":""}',
        },
        {
          role: 'user',
          content: JSON.stringify({ name, current }),
        },
      ],
      true,
    );

    if (!result || typeof result !== 'object' || Array.isArray(result)) {
      return {};
    }

    const enriched = result as Record<string, unknown>;
    return {
      industry: this.optionalString(enriched.industry),
      scale: this.optionalString(enriched.scale),
      description: this.optionalString(enriched.description),
      website: this.optionalString(enriched.website),
    };
  }

  private optionalString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }
}
