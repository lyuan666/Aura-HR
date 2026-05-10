import { Injectable, Logger } from '@nestjs/common';
import { ParsingService } from './parsing.service';
import { PdfExtractionService } from './pdf-extraction.service';
import { InsightService } from './insight.service';
import { LlmClientService } from './llm-client.service';

@Injectable()
export class AiService {
  constructor(
    private readonly parsingService: ParsingService,
    private readonly pdfExtractionService: PdfExtractionService,
    private readonly insightService: InsightService,
    private readonly llmClient: LlmClientService,
  ) {}

  async parseResume(textContent: string) {
    return this.llmClient.callAi([
      { role: 'system', content: '提取简历 JSON：basicInfo, workExperience, education。' },
      { role: 'user', content: textContent.slice(0, 6000) }
    ], true);
  }

  async parseFile(buffer: Buffer, originalName: string, type: 'resume' | 'jd') {
    if (type === 'resume') return this.parsingService.parseResumeFast(buffer, originalName);
    // JD path: extract text from file first, then parse with LLM
    const extracted = await this.pdfExtractionService.extractStructuredText(buffer, originalName);
    return this.parsingService.parseJobDescription(extracted.text);
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
