import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as mammoth from 'mammoth';
import pdf from 'pdf-parse';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);
const writeFilePromise = promisify(fs.writeFile);
const unlinkPromise = promisify(fs.unlink);

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey = process.env.ZHIPU_API_KEY || process.env.BIGMODEL_API_KEY;
  private readonly apiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
  private readonly model = 'glm-4-flash'; // 默认使用 flash 版本保证响应速度与稳定性

  /**
   * 调用智谱 AI 通用接口
   */
  private async callAi(messages: any[], jsonMode = false) {
    if (!this.apiKey || this.apiKey.includes('your-zhipu-api-key')) {
      this.logger.error('智谱 API Key 未配置，请在 .env 中设置 ZHIPU_API_KEY');
      throw new Error('AI 服务配置缺失');
    }

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages,
          temperature: 0.1, // 降低随机性，保证 JSON 稳定性
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 30000,
        },
      );

      const content = response.data.choices[0].message.content;
      if (jsonMode) {
        // 尝试从 Markdown 代码块或纯文本中提取 JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('AI 未能返回有效的 JSON 结构');
        return JSON.parse(jsonMatch[0]);
      }
      return content;
    } catch (e) {
      this.logger.error(`AI 接口调用失败: ${e.message}`);
      throw new Error(`AI 服务异常: ${e.message}`);
    }
  }

  /**
   * 从 Buffer 中提取 PDF 文本
   */
  async extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
      const data = await (pdf as any)(buffer);
      return data.text;
    } catch (e) {
      this.logger.error('PDF 解析失败:', e);
      throw new Error('无法解析 PDF 文件内容');
    }
  }

  /**
   * 从 Buffer 中提取 Word (.docx) 文本
   */
  async extractTextFromDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (e) {
      this.logger.error('Docx 解析失败:', e);
      throw new Error('无法解析 Word 文件内容');
    }
  }

  /**
   * 智能解析文件并提取信息
   */
  async parseFile(buffer: Buffer, originalName: string, type: 'resume' | 'jd') {
    let text = '';
    const ext = originalName.split('.').pop()?.toLowerCase();

    if (ext === 'pdf') {
      text = await this.extractTextFromPdf(buffer);
    } else if (ext === 'docx') {
      text = await this.extractTextFromDocx(buffer);
    } else if (ext === 'txt') {
      text = buffer.toString('utf-8');
    } else {
      throw new Error('不支持的文件格式，仅支持 pdf, docx, txt');
    }

    if (type === 'resume') {
      return this.parseResumeViaPython(buffer, originalName);
    } else {
      return this.parseJobDescription(text);
    }
  }

  /**
   * 简历解析 - 桥接 Python 版 SmartResume (使用 Resume Analyst Prompt)
   */
  async parseResumeViaPython(buffer: Buffer, originalName: string) {
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    
    const tempPath = path.join(tempDir, `${Date.now()}-${originalName}`);
    await writeFilePromise(tempPath, buffer);

    try {
      this.logger.log(`正在调用 SmartResume Python 引擎解析: ${originalName}`);
      const scriptPath = path.join(process.cwd(), 'apps/api/scripts/start.py');
      const { stdout, stderr } = await execPromise(`python3 ${scriptPath} --file "${tempPath}"`);
      
      if (stderr && !stdout) {
        throw new Error(stderr);
      }

      // 提取 JSON部分
      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Python 引擎未返回有效数据');
      
      const result = JSON.parse(jsonMatch[0]);
      this.logger.log(`SmartResume 解析成功: ${result.name}`);
      return result;
    } catch (e) {
      this.logger.error(`SmartResume 调用失败: ${e.message}`);
      throw e;
    } finally {
      await unlinkPromise(tempPath).catch(() => {});
    }
  }

  /**
   * 简历解析 (核心逻辑 - 使用 Resume Analyst Prompt)
   */
  async parseResume(textContent: string) {
    this.logger.log('正在调用智谱 AI 进行简历深度解析 (Resume Analyst)...');
    const system_prompt = `# Role: Resume Analyst : 专注于从简历中提取关键信息，并将其转化为结构化数据。
## Goals
提取简历中的技能、工作经历、教育背景和项目经历。
将提取的信息转化为结构化数据格式。
## Constrains
必须保持原始简历内容的准确性和完整性。
结构化数据应清晰、易于理解和检索。
## Skills
简历内容分析能力，数据结构化处理能力，精确的信息提取和总结能力
## Outputformat
请严格输出 JSON 格式，包含字段: name, phone, email, skills (数组), experience (工作经历列表), education (教育背景列表), projects (项目经历列表), yearsOfExperience (数字), summary (一句话总结).`;

    const result = await this.callAi([
      {
        role: 'system',
        content: system_prompt
      },
      {
        role: 'user',
        content: `1.仔细阅读并分析简历内容：\n\n${textContent.slice(0, 15000)}\n\n2.提取关键信息并以JSON输出。`
      }
    ], true);
    
    this.logger.log(`解析结果已生成: ${result.name}`);
    return result;
  }

  /**
   * 岗位 JD 生成 (使用 岗位JD编写专家 Prompt)
   */
  async generateJobDescription(info: string, responsibilities: string, skills: string) {
    this.logger.log('正在调用 AI 生成专业岗位描述...');
    const result = await this.callAi([
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
    return result;
  }

  /**
   * 职位描述解析 (使用智谱 GLM-4)
   */
  async parseJobDescription(textContent: string) {
    this.logger.log('正在调用智谱 AI 解析职位描述 (JD Analyst)...');
    const result = await this.callAi([
      {
        role: 'system',
        content: `# Role: Job Description Analyst : 分析并提取岗位描述中的关键要求，转换为结构化格式
## Goals: 从给定的岗位描述中提取关键要求，包括技能要求、项目经验、最低学历、相关证书和资格认证、语言能力等。
## Constrains: 必须遵循结构化格式，确保信息准确无误。
## Output Format: 请返回 JSON，包含字段: requiredSkills (列表), projectExperience (描述), minEducation (学历), certificates (列表), languageAbility (描述)。`
      },
      {
        role: 'user',
        content: `读取并分析岗位描述文本：\n\n${textContent.slice(0, 5000)}`
      }
    ], true);
    return result;
  }

  /**
   * 人岗匹配报告 (使用智谱 GLM-4)
   */
  async generateMatchingReport(candidateProfile: any, jobProfile: any) {
    this.logger.log('正在计算语义相似度并生成匹配度评分...');
    const result = await this.callAi([
      {
        role: 'system',
        content: 'Goal: 请基于以下岗位和候选人画像，计算语义相似度，输出候选人与岗位的匹配度评分（0-100%）。请返回 JSON: { "score": 0-100, "reason": "简短理由" }'
      },
      {
        role: 'user',
        content: `岗位画像：${JSON.stringify(jobProfile)}\n候选人画像：${JSON.stringify(candidateProfile)}`
      }
    ], true);
    return result;
  }

  /**
   * 结构化面试报告 (使用 评估报告 Prompt)
   */
  async generateInterviewReport(interviewText: string) {
    this.logger.log('正在生成结构化面试评估报告...');
    const result = await this.callAi([
      {
        role: 'system',
        content: `请根据提供的面试内容生成一份结构化的面试报告，包含：1.基本信息 2.专业技能(及评分0-10) 3.工作经验(及评分0-10) 4.项目经历(及评分0-10) 5.沟通与协作(及评分0-10) 6.学习能力与动机(及评分0-10) 7.整体评价与匹配度(0-100)。请以 JSON 格式输出所有字段。`
      },
      {
        role: 'user',
        content: `面试内容：${interviewText.slice(0, 10000)}`
      }
    ], true);
    return result;
  }

  /**
   * 邀约话术生成 (使用智谱 GLM-4)
   */
  async generateOutreachMessage(resumeText: string, jobTitle: string, jobDescription: string) {
    this.logger.log('正在生成 AI 邀约话术 (GLM)...');
    return await this.callAi([
      {
        role: 'system',
        content: '你是一个资深猎头。请根据候选人背景和职位描述生成一段专业、热情的邀约话术。直接返回话术文本内容，不要包含其他解释。'
      },
      {
        role: 'user',
        content: `简历背景：${resumeText.slice(0, 2000)}\n目标职位名称：${jobTitle}\nJD详情：${jobDescription.slice(0, 1000)}`
      }
    ]);
  }

  /**
   * 跟进建议 (使用智谱 GLM-4)
   */
  async generateFollowUpStrategy(context: string, targetType: string) {
    this.logger.log('正在生成 AI 跟进策略 (GLM)...');
    return await this.callAi([
      {
        role: 'system',
        content: `你是一个资深 CRM 顾问。请为该${targetType === 'candidate' ? '候选人' : '企业客户'}生成下一步的跟进建议（包括时机、沟通重点等）。直接返回文本内容。`
      },
      {
        role: 'user',
        content: `跟进环境轨迹/背景：\n${context.slice(0, 2000)}`
      }
    ]);
  }
}
