import { Injectable, Logger } from '@nestjs/common';
import { LlmClientService } from './llm-client.service';

@Injectable()
export class InsightService {
  private readonly logger = new Logger(InsightService.name);

  constructor(private readonly llmClient: LlmClientService) {}

  async generateMatchingReport(candidateProfile: any, jobProfile: any) {
    return this.llmClient.callAi([
      { role: 'system', content: '基于岗位和候选人画像，计算相似度并输出 JSON: { "score": 0-100, "reason": "简短理由" }' },
      { role: 'user', content: `岗位：${JSON.stringify(jobProfile)}\n候选人：${JSON.stringify(candidateProfile)}` }
    ], true);
  }

  async generateJobDescription(info: string, responsibilities: string, skills: string) {
    return this.llmClient.callAi([
      {
        role: 'system',
        content: `# Role: 岗位JD编写专家 : 专注于撰写岗位描述和任职要求
## Goals: 根据用户提供的岗位信息，生成准确的岗位JD
## Constrains: 保持用户原有意图，使用正式和专业的语言，符合行业标准
## Skills: 深入理解各种岗位的核心职责和技能要求，具备优秀的文案撰写能力
## Output Format: 以列表形式呈现岗位描述和任职要求，清晰有序`
      },
      {
        role: 'user',
        content: `请根据以下信息生成JD：\n岗位信息：${info}\n核心职责：${responsibilities}\n技能要求：${skills}`
      }
    ]);
  }

  async generateInterviewReport(interviewText: string) {
    return this.llmClient.callAi([
      { role: 'system', content: '生成结构化面试报告 JSON，包含评分和匹配度评价。' },
      { role: 'user', content: `面试内容：${interviewText.slice(0, 8000)}` }
    ], true);
  }

  async generateOutreachMessage(resumeText: string, jobTitle: string, jobDescription: string) {
    return this.llmClient.callAi([
      { role: 'system', content: '资深猎头角色，生成专业邀约话术。' },
      { role: 'user', content: `简历：${resumeText.slice(0, 2000)}\n职位：${jobTitle}\nJD：${jobDescription.slice(0, 1000)}` }
    ]);
  }

  async generateFollowUpStrategy(context: string, targetType: string) {
    return this.llmClient.callAi([
      { role: 'system', content: '资深 CRM 顾问，提供跟进建议。' },
      { role: 'user', content: `背景：${context.slice(0, 2000)}` }
    ]);
  }
}
