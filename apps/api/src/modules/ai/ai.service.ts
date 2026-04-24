import { Injectable, Logger } from '@nestjs/common';
import { ParsingService } from './parsing.service';
import { InsightService } from './insight.service';

@Injectable()
export class AiService {
  constructor(
    private readonly parsingService: ParsingService,
    private readonly insightService: InsightService,
  ) {}

  async parseResume(textContent: string) {
    return this.parsingService.parseResumeFullFallback(textContent, {});
  }

  async parseFile(buffer: Buffer, originalName: string, type: 'resume' | 'jd') {
    if (type === 'resume') return this.parsingService.parseResumeFast(buffer, originalName);
    return this.parsingService.parseJobDescription(buffer.toString('utf-8'));
  }

  async parseResumeFast(buffer: Buffer, originalName: string) {
    return this.parsingService.parseResumeFast(buffer, originalName);
  }

  async parseJobDescription(textContent: string) {
    return this.parsingService.parseJobDescription(textContent);
  }

  async generateMatchingReport(candidateProfile: any, jobProfile: any) {
    return this.insightService.generateMatchingReport(candidateProfile, jobProfile);
  }

  async generateInterviewReport(interviewText: string) {
    return this.insightService.generateInterviewReport(interviewText);
  }

  async generateOutreachMessage(resumeText: string, jobTitle: string, jobDescription: string) {
    return this.insightService.generateOutreachMessage(resumeText, jobTitle, jobDescription);
  }

  async generateJobDescription(info: string, responsibilities: string, skills: string) {
    return this.insightService.generateJobDescription(info, responsibilities, skills);
  }

  async generateFollowUpStrategy(context: string, targetType: string) {
    return this.insightService.generateFollowUpStrategy(context, targetType);
  }
}
