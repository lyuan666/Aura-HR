import { Injectable, Logger } from '@nestjs/common';
import * as mammoth from 'mammoth';
const pdf = require('pdf-parse');
import { LlmClientService } from './llm-client.service';

@Injectable()
export class ParsingService {
  private readonly logger = new Logger(ParsingService.name);

  private readonly SKILL_TAXONOMY = [
    'Java', 'Python', 'Go', 'Node.js', 'React', 'Vue', 'Angular', 'Next.js', 'Flutter', 'TypeScript',
    'Spring Boot', 'MyBatis', 'Redis', 'MySQL', 'PostgreSQL', 'MongoDB', 'Kafka', 'Docker', 'Kubernetes',
    'PyTorch', 'TensorFlow', 'NLP', 'CV', 'Hadoop', 'Spark', 'Flink', 'Hive', 'Data Warehouse',
    'AWS', 'Azure', 'Aliyun', 'Tencent Cloud', 'Microservices', 'Distributed Systems',
    'HTML5', 'CSS3', 'Sass', 'Less', 'Webpack', 'Vite', 'Unity', 'C++', 'C#', 'Rust',
    'Project Management', 'Product Design', 'UI/UX', 'SEO', 'SEM', 'CRM', 'ERP'
  ];

  constructor(private readonly llmClient: LlmClientService) {}

  async extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
      const data = await (pdf as any)(buffer);
      return data.text;
    } catch (e) {
      throw new Error('无法解析 PDF 文件内容');
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

    const baseInfo = this.extractContactViaRules(text);
    const skills = this.extractSkillsViaTaxonomy(text);
    const segments = this.segmentTextByHeaders(text);

    try {
      const [parsedBasic, parsedWork, parsedEdu, parsedProject] = await Promise.all([
        this.extractBasicInfoSlice(segments.basic),
        this.extractWorkExpSlice(segments.work),
        this.extractEduHistorySlice(segments.edu),
        this.extractProjectExpSlice(segments.project),
      ]);

      return {
        basicInfo: { ...baseInfo, ...parsedBasic },
        workExperience: Array.isArray(parsedWork) ? parsedWork : [],
        education: Array.isArray(parsedEdu) ? parsedEdu : [],
        projectExperience: Array.isArray(parsedProject) ? parsedProject : [],
        skills,
        metadata: {
          parseTime: `${((Date.now() - start) / 1000).toFixed(2)}s`,
          engine: 'Omni-Parse-Hybrid',
        },
      };
    } catch (e) {
      return this.parseResumeFullFallback(text, baseInfo);
    }
  }

  private async parseResumeVision(buffer: Buffer) {
    const base64 = buffer.toString('base64');
    const parsed = await this.llmClient.callAi(
      [
        {
          role: 'user',
          content: [
            { type: 'text', text: '提取简历 JSON：basicInfo, workExperience, education, projectExperience。' },
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

  private extractContactViaRules(text: string) {
    const phoneRegex = /(?:(?:\+|00)86)?\s?1[3-9]\d{9}/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phones = text.match(phoneRegex) || [];
    const emails = text.match(emailRegex) || [];
    return { phoneNumber: phones[0] || '', personalEmail: emails[0] || '' };
  }

  private extractSkillsViaTaxonomy(text: string): string[] {
    const found = new Set<string>();
    const lowerText = text.toLowerCase();
    for (const skill of this.SKILL_TAXONOMY) {
      if (lowerText.includes(skill.toLowerCase())) found.add(skill);
    }
    return Array.from(found);
  }

  private segmentTextByHeaders(text: string) {
    const headers = {
      work: /工作经历|职业经历|工作经验|Experience|Work History/i,
      edu: /教育背景|教育经历|毕业院校|学习经历|Education|Academic|学历/i,
      project: /项目经历|项目背景|项目经验|Project Experience|Projects/i,
    };
    const findIndex = (regex: RegExp) => (text.match(regex)?.index ?? -1);
    const workIndex = findIndex(headers.work);
    const eduIndex = findIndex(headers.edu);
    const projectIndex = findIndex(headers.project);

    const indices = [
      { type: 'work', idx: workIndex },
      { type: 'edu', idx: eduIndex },
      { type: 'project', idx: projectIndex }
    ].filter(i => i.idx !== -1).sort((a, b) => a.idx - b.idx);

    const segments: any = { basic: text.slice(0, indices[0]?.idx), work: '', edu: '', project: '' };
    for (let i = 0; i < indices.length; i++) {
      const current = indices[i];
      const next = indices[i + 1];
      segments[current.type] = text.slice(current.idx, next?.idx);
    }
    return segments;
  }

  private async extractBasicInfoSlice(slice: string) {
    if (!slice || slice.length < 5) return {};
    return this.llmClient.callAi([
      { role: 'system', content: '提取：姓名(name)、性别(gender)、年龄(ageNum)、手机号(phoneNumber)、邮箱(personalEmail)、当前城市(currentLocation)。' },
      { role: 'user', content: slice.slice(0, 2000) }
    ], true);
  }

  private async extractWorkExpSlice(slice: string) {
    if (!slice || slice.length < 10) return [];
    return this.llmClient.callAi([
      { role: 'system', content: '提取工作经历列表：companyName, position, duration, content(字符串数组)。' },
      { role: 'user', content: slice.slice(0, 4000) }
    ], true);
  }

  private async extractEduHistorySlice(slice: string) {
    if (!slice || slice.length < 10) return [];
    return this.llmClient.callAi([
      { role: 'system', content: '提取教育背景列表：school, major, degreeLevel, duration。' },
      { role: 'user', content: slice.slice(0, 2000) }
    ], true);
  }

  private async extractProjectExpSlice(slice: string) {
    if (!slice || slice.length < 10) return [];
    return this.llmClient.callAi([
      { role: 'system', content: '提取项目经历列表：projectName, role, duration, description。' },
      { role: 'user', content: slice.slice(0, 3000) }
    ], true);
  }

  public async parseResumeFullFallback(text: string, baseInfo: any) {
    const result = await this.llmClient.callAi([
      { role: 'system', content: '提取简历 JSON：basicInfo, workExperience, education。' },
      { role: 'user', content: text.slice(0, 6000) }
    ], true);
    return { ...result, basicInfo: { ...baseInfo, ...result.basicInfo } };
  }

  async parseJobDescription(textContent: string) {
    return this.llmClient.callAi([
      { role: 'system', content: '提取 JD JSON: requiredSkills(列表), minEducation, title, salaryMin, salaryMax, summary。' },
      { role: 'user', content: textContent.slice(0, 4000) }
    ], true);
  }
}
