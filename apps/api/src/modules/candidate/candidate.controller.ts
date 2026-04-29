import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Sse, UseInterceptors, UploadedFile, UploadedFiles, BadRequestException, Req, Res, UnauthorizedException } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { Observable, throwError } from 'rxjs';
import { createHash } from 'crypto';
import { v4 as uuid } from 'uuid';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JwtService } from '@nestjs/jwt';
import { CandidateService } from './candidate.service';
import { AiService } from '../ai/ai.service';
import { ProgressService } from './progress.service';
import { StorageService } from '../storage/storage.service';
import { CreateCandidateDto } from './candidate.dto';

const UPLOAD_LIMITS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 50,
  allowedMimeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
  ],
};

@Controller('candidates')
export class CandidateController {
  constructor(
    private readonly candidateService: CandidateService,
    private readonly aiService: AiService,
    private readonly progressService: ProgressService,
    private readonly storage: StorageService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectQueue('parse-resume') private readonly parseQueue: Queue,
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

  // ========== V2 批量上传 + SSE 进度 ==========

  @Post('batch-upload')
  @UseInterceptors(
    FilesInterceptor('files', UPLOAD_LIMITS.maxFiles, {
      limits: { fileSize: UPLOAD_LIMITS.maxFileSize },
    }),
  )
  async batchUpload(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
    @Body('sourcePlatform') sourcePlatform?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('未检测到上传的文件');
    }

    const tenantId = req.user?.tenantId;
    const batchId = uuid();
    const jobs: any[] = new Array(files.length);
    const enqueueFile = async (file: Express.Multer.File, index: number) => {
      // 文件类型校验
      if (!UPLOAD_LIMITS.allowedMimeTypes.includes(file.mimetype)) {
        jobs[index] = {
          fileName: file.originalname,
          status: 'rejected',
          error: `不支持的文件类型: ${file.mimetype}`,
        };
        return;
      }

      const fileHash = createHash('sha256').update(file.buffer).digest('hex');
      const safeName = file.originalname.replace(/[/\\]/g, '_');
      const fileKey = `resumes/${tenantId}/${batchId}/${uuid()}-${safeName}`;

      // 存原始文件到 MinIO
      await this.storage.putObject('uploads', fileKey, file.buffer, file.size, file.mimetype);

      const job = await this.parseQueue.add(
        'parse-resume',
        {
          tenantId,
          fileKey,
          fileName: file.originalname,
          fileSize: file.size,
          fileHash,
          sourcePlatform: sourcePlatform || 'manual_upload',
          batchId,
        },
        {
          jobId: `parse-${fileHash.substring(0, 16)}`,
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 50 },
        },
      );

      jobs[index] = {
        jobId: job.id,
        fileName: file.originalname,
        fileHash,
        status: 'queued',
      };
    };

    const concurrency = 4;
    for (let i = 0; i < files.length; i += concurrency) {
      await Promise.all(files.slice(i, i + concurrency).map((file, offset) => enqueueFile(file, i + offset)));
    }

    return {
      success: true,
      batchId,
      total: files.length,
      queued: jobs.filter((j) => j.status === 'queued').length,
      rejected: jobs.filter((j) => j.status === 'rejected').length,
      jobs,
    };
  }

  @Sse('upload-progress/:key')
  uploadProgress(
    @Param('key') key: string,
    @Query('token') token: string,
  ): Observable<MessageEvent> {
    // SSE 无法设 header，用 query param 传 JWT
    try {
      this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET') || 'dev-secret-key',
      });
    } catch {
      return throwError(() => new UnauthorizedException('无效或过期的 token'));
    }
    return this.progressService.getStream(key);
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
