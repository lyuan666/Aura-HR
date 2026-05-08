import { Injectable, Logger } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { LlmClientService } from './llm-client.service';

// 精简 prompt：提取核心字段 + 项目经历 + 自我评价 + 求职期望
const SYSTEM_PROMPT = `提取简历JSON，只输出JSON不要其他文字：
{"basicInfo":{"name":"","gender":"男或女","ageNum":0,"phoneNumber":"","personalEmail":"","currentLocation":"城市","desiredLocation":[],"desiredPosition":"","desiredSalary":""},"workExperience":[{"companyName":"","position":"","duration":"","description":"","department":"","reportTo":"","subordinates":"","achievements":"","awards":"","leaveReason":""}],"projectExperience":[{"projectName":"","role":"","duration":"","description":"","achievements":""}],"education":[{"school":"","major":"","degreeLevel":"","duration":"","activities":""}],"skills":[],"selfEvaluation":"","summary":""}
规则：location只填城市名；school必须是真实学校；skills提取所有专业关键词；description尽量保留原文完整描述，用分号分隔多条；projectExperience必须提取简历中所有项目经历，包括项目描述和业绩；selfEvaluation提取"自我评价"/"个人评价"/"个人优势"章节的完整内容；basicInfo.desiredLocation填期望城市数组；找不到的字段填null或[]`;

@Injectable()
export class ParsingService {
  private readonly logger = new Logger(ParsingService.name);

  constructor(private readonly llmClient: LlmClientService) {}

  async extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
      let text = '';
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ') + '\n';
      }
      return text;
    } catch (e) {
      this.logger.warn(`PDF 文本提取失败，将走 Vision 路径: ${(e as Error).message}`);
      return '';
    }
  }

  async extractTextFromDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (e) {
      throw new Error('无法解析 Word 文件内容');
    }
  }

  async parseResumeFast(buffer: Buffer, originalName: string) {
    const start = Date.now();
    let text = '';
    const ext = originalName.split('.').pop()?.toLowerCase();

    if (ext === 'pdf') {
      text = await this.extractTextFromPdf(buffer);
      if (text.trim().length < 5) return this.parseResumeVision(buffer);
    } else if (ext === 'docx') {
      text = await this.extractTextFromDocx(buffer);
    } else if (['jpg', 'jpeg', 'png'].includes(ext || '')) {
      return this.parseResumeVision(buffer);
    } else {
      text = buffer.toString('utf-8');
    }

    // 规则提取联系方式（补充 LLM 遗漏）
    const ruleContact = this.extractContactViaRules(text);

    // 单次 LLM 全文解析（精简输出，max_tokens 限制）
    const parsed: any = await this.llmClient.callAi([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: text.slice(0, 5000) },
    ], true, 2, undefined, true, 3000);

    const basicInfo = { ...ruleContact, ...(parsed?.basicInfo || {}) };
    this.sanitizeBasicInfo(basicInfo);

    const workExperience = this.sanitizeWorkExp(this.ensureArray(parsed?.workExperience), text);
    const education = this.sanitizeEducation(this.ensureArray(parsed?.education));
    const projectExperience = this.ensureArray(parsed?.projectExperience);
    const skills = this.mergeSkills(parsed?.skills);
    const selfEvaluation = parsed?.selfEvaluation || '';
    const summary = parsed?.summary || '';

    return {
      basicInfo,
      workExperience,
      education,
      projectExperience,
      skills,
      selfEvaluation,
      summary,
      metadata: {
        parseTime: `${((Date.now() - start) / 1000).toFixed(2)}s`,
        engine: 'Omni-Parse-v5',
      },
    };
  }

  private async parseResumeVision(buffer: Buffer) {
    const base64 = buffer.toString('base64');
    const parsed = await this.llmClient.callAi(
      [
        {
          role: 'user',
          content: [
            { type: 'text', text: SYSTEM_PROMPT },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }
          ]
        }
      ],
      true,
      3,
      this.llmClient.getVisionModel(),
      true
    );
    return { ...parsed, metadata: { engine: 'Omni-Parse-Vision' } };
  }

  // ---- 规则辅助 ----

  private extractContactViaRules(text: string) {
    const phoneRegex = /(?:(?:\+|00)86)?\s?1[3-9]\d{9}/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phones = text.match(phoneRegex) || [];
    const emails = text.match(emailRegex) || [];
    return { phoneNumber: phones[0] || '', personalEmail: emails[0] || '' };
  }

  private sanitizeBasicInfo(info: any) {
    if (info.currentLocation) {
      if (/\d|年|经验|工作|岁|以上|以下/.test(info.currentLocation)) {
        info.currentLocation = '';
      }
      if (info.currentLocation) {
        info.currentLocation = info.currentLocation.split(/[,，、\s]/)[0].trim();
      }
    }
    if (info.gender) {
      const g = String(info.gender);
      if (g.includes('男') || g.toLowerCase() === 'male') info.gender = '男';
      else if (g.includes('女') || g.toLowerCase() === 'female') info.gender = '女';
      else info.gender = '';
    }
    if (info.ageNum != null) {
      const n = Number(info.ageNum);
      info.ageNum = (Number.isFinite(n) && n > 15 && n < 80) ? n : null;
    }
  }

  /** 从原文中补充工作经历的 content 字段 */
  private sanitizeWorkExp(workExp: any[], text: string): any[] {
    for (const w of workExp) {
      if (!w.content || w.content.length === 0) {
        // 尝试从原文中提取该公司对应的工作内容
        const company = (w.companyName || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (company) {
          const regex = new RegExp(company + '.*?(?:内容:?|职责:?|\\n\\d\\)|\\n-)\\s*([\\s\\S]{10,300}?)(?=\\n\\n|\\n[A-Z]|$)', 'i');
          const m = text.match(regex);
          if (m) {
            w.content = m[1].split(/\n/).map(s => s.replace(/^[\s\-\d\).]+/, '').trim()).filter(s => s.length > 5).slice(0, 5);
          }
        }
      }
    }
    return workExp;
  }

  private sanitizeEducation(eduList: any[]): any[] {
    const invalidSchools = ['教育经历', '教育背景', '作品展示', 'Boss', '直聘', '微信', '小程序', '资格证书'];
    return eduList.filter(e => {
      const school = (e.school || '').trim();
      if (!school || school.length < 2) return false;
      if (invalidSchools.some(k => school.includes(k))) return false;
      return true;
    });
  }

  private mergeSkills(llmSkills: any): string[] {
    const merged = new Set<string>();
    if (Array.isArray(llmSkills)) {
      for (const s of llmSkills) {
        if (typeof s === 'string' && s.trim()) merged.add(s.trim());
      }
    }
    return Array.from(merged);
  }

  private ensureArray(val: any): any[] {
    if (Array.isArray(val)) return val;
    if (val && typeof val === 'object') return [val];
    return [];
  }

  async parseJobDescription(textContent: string) {
    return this.llmClient.callAi([
      { role: 'system', content: '提取 JD JSON: requiredSkills(列表), minEducation, title, salaryMin, salaryMax, summary。' },
      { role: 'user', content: textContent.slice(0, 4000) }
    ], true);
  }
}
