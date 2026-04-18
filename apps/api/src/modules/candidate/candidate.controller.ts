import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CandidateService } from './candidate.service';
import { AiService } from '../ai/ai.service';
import { CreateCandidateDto } from './candidate.dto';

@Controller('candidates')
export class CandidateController {
  constructor(
    private readonly candidateService: CandidateService,
    private readonly aiService: AiService
  ) {}

  @Get()
  findAll() {
    return this.candidateService.findAll();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadResume(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('未检测到上传的文件');
    }

    try {
      console.log('--- 开始处理简历实操解析 (Ollama) ---');
      console.log('文件名称:', file.originalname);
      
      // 1. 调用 AI 服务解析文件内容 (分步稳定触发)
      const parsedData: any = await this.aiService.parseFile(file.buffer, file.originalname, 'resume');
      console.log('AI 解析成功，开始构造 DTO...');

      // 2. 将解析结果映射为 CreateCandidateDto (精准对接)
      const candidateDto: CreateCandidateDto = {
        name: parsedData.name || '未知候选人-' + new Date().getTime(),
        phone: parsedData.phone || '',
        email: parsedData.email || '',
        totalYears: Number(parsedData.yearsOfExperience) || 0,
        degree: parsedData.education || '',
        status: 'new', // 必须符合实体 enum: ['new', 'active', 'in_process', 'offered', 'placed', 'inactive']
        resumeText: parsedData.experience || '',
        notes: `AI 提取技能: ${Array.isArray(parsedData.skills) ? parsedData.skills.join(', ') : '无'}`,
        parsedTags: {
          skills: parsedData.skills || [],
          salaryExpectation: parsedData.estimatedSalary || '',
          stability: parsedData.stabilityScore || 0,
          aiTags: parsedData.tags || []
        }
      };

      // 3. 物理入库
      const result = await this.candidateService.create(candidateDto);
      console.log('候选人数据已成功存入 PostgreSQL 数据库:', result.id);
      
      return {
        success: true,
        data: result,
        message: '简历解析入库成功'
      };
    } catch (e) {
      console.error('❌ [简历解析链路崩溃]:', e);
      // 终极诊断：将所有错误详细信息透传给前端
      const errorDetail: Record<string, any> = {};
      Object.getOwnPropertyNames(e).forEach(key => {
        errorDetail[key] = (e as any)[key];
      });
      
      return {
        success: false,
        message: '解析失败: ' + (e.message || '未知异常'),
        debug: errorDetail
      };
    }
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.candidateService.semanticSearch(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.candidateService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCandidateDto) {
    return this.candidateService.create(dto);
  }
}
