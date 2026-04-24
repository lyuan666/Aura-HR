import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, BadRequestException, Req } from '@nestjs/common';
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
  findAll(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    const tenantId = req.user?.tenantId;
    return this.candidateService.findAll(Number(page), Number(pageSize), tenantId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadResume(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    if (!file) {
      throw new BadRequestException('未检测到上传的文件');
    }

    try {
      console.log('--- 开始 Omni-Parse v4 全模态解析 ---');
      console.log('文件名称:', file.originalname);

      
      // 1. 调用极速混合解析流水线
      const parsedData: any = await this.aiService.parseFile(file.buffer, file.originalname, 'resume');
      const parseTime = parsedData.metadata?.parseTime || 'unknown';
      console.log(`解析耗时: ${parseTime}，开始构造 DTO...`);

      // 2. 提取结构化数据
      const basicInfo = parsedData.basicInfo || {};
      const workExp = Array.isArray(parsedData.workExperience) ? parsedData.workExperience : [];
      const eduList = Array.isArray(parsedData.education) ? parsedData.education : [];
      const projectExp = Array.isArray(parsedData.projectExperience) ? parsedData.projectExperience : [];
      
      const latestWork = workExp[0] || {};
      const latestEdu = eduList[0] || {};


      // 后端映射：中文性别 -> Enum
      const genderMap: Record<string, string> = { '男': 'male', '女': 'female' };
      const gender = genderMap[basicInfo.gender] || 'unknown';

      // 3. 映射为 CreateCandidateDto
      const candidateDto: CreateCandidateDto = {
        name: basicInfo.name || '未知候选人-' + Date.now(),
        phone: basicInfo.phoneNumber || '',
        email: basicInfo.personalEmail || '',
        gender,
        age: basicInfo.ageNum || undefined,
        location: basicInfo.currentLocation || '',
        currentCompany: latestWork.companyName || '',
        currentTitle: latestWork.position || '',
        totalYears: workExp.length || 0,
        degree: latestEdu.degreeLevel || '',
        school: latestEdu.school || '',
        major: latestEdu.major || '',
        status: 'new',
        workExperiences: workExp,
        educationHistory: eduList,
        projectExperiences: projectExp,
        resumeText: JSON.stringify(parsedData, null, 2),
        parsedTags: {
          desiredLocation: basicInfo.desiredLocation || [],
          placeOfOrigin: basicInfo.placeOfOrigin || '',
          skills: parsedData.skills || [],
          source: 'Omni-Parse-v4',
          engine: parsedData.metadata?.engine || 'v4',
          parseTime,
        },
        notes: `Omni-Parse v4 | 耗时 ${parseTime} | ${workExp.length}经历/${eduList.length}教育/${(parsedData.skills || []).length}技能`,
      };



      // 4. 物理入库
      const result = await this.candidateService.create(candidateDto, tenantId);
      console.log('候选人数据已成功存入 PostgreSQL 数据库:', result.id);
      
      return {
        success: true,
        data: result,
        message: '简历解析入库成功'
      };
    } catch (e: any) {
      console.error('❌ [简历解析链路崩溃]:', e);
      
      return {
        success: false,
        message: e.message || '解析链路异常',
        debug: process.env.NODE_ENV === 'development' ? e.stack : undefined
      };
    }
  }

  @Get('search')
  search(@Query('q') query: string, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.candidateService.semanticSearch(query, tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.candidateService.findOne(id, tenantId);
  }

  @Post()
  create(@Body() dto: CreateCandidateDto, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.candidateService.create(dto, tenantId);
  }
}
