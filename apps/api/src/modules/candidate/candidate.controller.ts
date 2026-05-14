import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Header,
  Param,
  Post,
  Query,
  Req,
  Res,
  Sse,
  UnauthorizedException,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { Observable, throwError } from 'rxjs';
import { createHash, randomUUID } from 'crypto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { CandidateService } from './candidate.service';
import { AiService } from '../ai/ai.service';
import { PdfExtractionService } from '../ai/pdf-extraction.service';
import { ProgressService } from './progress.service';
import { StorageService } from '../storage/storage.service';
import { FeishuService } from './feishu.service';
import { CreateCandidateDto } from './candidate.dto';
import { PageQueryDto } from '../../common/dto/page-query.dto';
import { Public } from '../../common/decorators/public.decorator';

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
    private readonly pdfExtractionService: PdfExtractionService,
    private readonly progressService: ProgressService,
    private readonly storage: StorageService,
    private readonly feishuService: FeishuService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectQueue('parse-resume') private readonly parseQueue: Queue,
  ) {}

  @Get()
  findAll(@Req() req: any, @Query() query: PageQueryDto) {
    const tenantId = this.requireTenantId(req);
    return this.candidateService.findAll(query.page, query.pageSize, tenantId);
  }

  @Post('feishu-import')
  async importFromFeishu(
    @Body('appToken') appToken: string,
    @Body('tableId') tableId: string,
    @Body('personalToken') personalToken: string,
    @Req() req: any,
  ) {
    const tenantId = this.requireTenantId(req);
    if (!appToken || !tableId || !personalToken) {
      throw new BadRequestException(
        '缺失飞书多维表格的凭证参数 (appToken, tableId, personalToken)',
      );
    }

    // 1. 获取飞书数据
    const result = await this.feishuService.importFromBitable(
      appToken,
      tableId,
      personalToken,
    );

    // 2. 将获取到的 candidates 存入数据库
    // 简化处理：将飞书的每行数据直接转化为 CandidateDto 并批量入库
    let successCount = 0;
    for (const item of result.items) {
      try {
        const dto: CreateCandidateDto = {
          name: item.name,
          phone: item.phone,
          email: item.email,
          gender:
            item.gender === '男'
              ? 'male'
              : item.gender === '女'
                ? 'female'
                : 'unknown',
          currentCompany: item.currentCompany,
          currentTitle: item.currentTitle,
          status: 'new',
          parsedTags: {
            source: 'feishu_bitable',
          },
          notes: `导入自飞书多维表格: ${appToken}`,
        };
        await this.candidateService.create(dto, tenantId);
        successCount++;
      } catch (err) {
        console.error(`导入飞书记录 ${item.id} 失败`, err);
      }
    }

    return {
      success: true,
      message: `成功从飞书读取 ${result.total} 条记录，成功入库 ${successCount} 条`,
    };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadResume(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const tenantId = this.requireTenantId(req);
    if (!file) {
      throw new BadRequestException('未检测到上传的文件');
    }

    try {
      console.log('--- 开始 Omni-Parse v4 全模态解析 ---');
      console.log('文件名称:', file.originalname);

      // 1. 调用极速混合解析流水线
      const parsedData: any = await this.aiService.parseFile(
        file.buffer,
        file.originalname,
        'resume',
      );
      const parseTime = parsedData.metadata?.parseTime || 'unknown';
      console.log(`解析耗时: ${parseTime}，开始构造 DTO...`);

      // 2. 提取结构化数据
      const basicInfo = parsedData.basicInfo || {};
      const workExp = Array.isArray(parsedData.workExperience)
        ? parsedData.workExperience
        : [];
      const eduList = Array.isArray(parsedData.education)
        ? parsedData.education
        : [];
      const projectExp = Array.isArray(parsedData.projectExperience)
        ? parsedData.projectExperience
        : [];

      const latestWork = workExp[0] || {};
      const latestEdu = eduList[0] || {};
      const safeName = file.originalname.replace(/[/\\]/g, '_');
      const resumeKey = `resumes/${tenantId}/single/${randomUUID()}-${safeName}`;

      await this.storage.putObject(
        'uploads',
        resumeKey,
        file.buffer,
        file.size,
        file.mimetype,
      );

      // 后端映射：中文性别 -> Enum
      const genderMap: Record<string, string> = { 男: 'male', 女: 'female' };
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
        careerExpectations:
          basicInfo.desiredPosition || basicInfo.desiredLocation?.length
            ? {
                desiredPosition: basicInfo.desiredPosition || '',
                desiredLocation: basicInfo.desiredLocation || [],
                desiredSalary: basicInfo.desiredSalary || '',
              }
            : null,
        resumeUrl: resumeKey,
        resumeText: JSON.stringify(parsedData, null, 2),
        parsedTags: {
          desiredLocation: basicInfo.desiredLocation || [],
          placeOfOrigin: basicInfo.placeOfOrigin || '',
          skills: parsedData.skills || [],
          selfEvaluation: parsedData.selfEvaluation || '',
          source: 'Omni-Parse-v4',
          engine: parsedData.metadata?.engine || 'v4',
          parseTime,
        },
        notes: `Omni-Parse v4 | 耗时 ${parseTime} | ${workExp.length}经历/${eduList.length}教育/${projectExp.length}项目/${(parsedData.skills || []).length}技能`,
      };

      // 4. 物理入库
      const result = await this.candidateService.create(candidateDto, tenantId);
      console.log('候选人数据已成功存入 PostgreSQL 数据库:', result.id);

      return {
        success: true,
        data: result,
        message: '简历解析入库成功',
      };
    } catch (e: any) {
      console.error('❌ [简历解析链路崩溃]:', e);

      return {
        success: false,
        message: e.message || '解析链路异常',
        debug: process.env.NODE_ENV === 'development' ? e.stack : undefined,
      };
    }
  }

  @Get('search')
  search(@Query('q') query: string, @Req() req: any) {
    const tenantId = this.requireTenantId(req);
    return this.candidateService.semanticSearch(query, tenantId);
  }

  @Get(':id/resume')
  async getResumeFile(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const tenantId = this.requireTenantId(req);
    const candidate = await this.candidateService.findOne(id, tenantId);
    if (!candidate.resumeUrl) {
      return res
        .status(404)
        .json({ success: false, message: '该候选人暂无附件简历' });
    }

    const buffer = await this.storage.getObject('uploads', candidate.resumeUrl);
    const fileName = encodeURIComponent(
      candidate.resumeUrl.split('/').pop() || 'resume',
    );

    const ext = candidate.resumeUrl.split('.').pop()?.toLowerCase() || '';
    const contentTypes: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
    };
    const contentType = contentTypes[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buffer);
  }

  @Get(':id/resume-preview')
  async getResumePreview(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.requireTenantId(req);
    const candidate = await this.candidateService.findOne(id, tenantId);
    if (!candidate.resumeUrl) {
      throw new BadRequestException('该候选人暂无附件简历');
    }

    const fileName = candidate.resumeUrl.split('/').pop() || 'resume';
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    if (ext === 'doc') {
      return {
        previewType: 'download',
        fileName,
        extension: ext,
        message: 'DOC 格式暂不支持在线解析，请下载原文件查看',
      };
    }

    const buffer = await this.storage.getObject('uploads', candidate.resumeUrl);
    const extracted = await this.pdfExtractionService.extractStructuredText(
      buffer,
      fileName,
    );

    return {
      previewType: 'text',
      fileName,
      extension: ext,
      text: extracted.text,
      format: extracted.format,
      method: extracted.method,
    };
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

    const tenantId = this.requireTenantId(req);
    const batchId = randomUUID();
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
      const fileKey = `resumes/${tenantId}/${batchId}/${randomUUID()}-${safeName}`;

      // 存原始文件到 MinIO
      await this.storage.putObject(
        'uploads',
        fileKey,
        file.buffer,
        file.size,
        file.mimetype,
      );

      const jobId = `parse-${fileHash.substring(0, 16)}`;
      const existingJob = await this.parseQueue.getJob(jobId);
      if (existingJob && (await existingJob.getState()) === 'failed') {
        await existingJob.remove();
      }

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
          jobId,
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
      await Promise.all(
        files
          .slice(i, i + concurrency)
          .map((file, offset) => enqueueFile(file, i + offset)),
      );
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

  @Public()
  @Sse('upload-progress/:key')
  uploadProgress(
    @Param('key') key: string,
    @Query('token') token: string,
    @Req() req: any,
  ): Observable<MessageEvent> {
    const streamToken = token || this.extractTokenFromRequest(req);
    try {
      this.jwtService.verify(streamToken, {
        secret:
          this.configService.get<string>('JWT_SECRET') || 'dev-secret-key',
      });
    } catch {
      return throwError(() => new UnauthorizedException('无效或过期的 token'));
    }
    return this.progressService.getStream(key);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.requireTenantId(req);
    return this.candidateService.findOne(id, tenantId);
  }

  @Post()
  create(@Body() dto: CreateCandidateDto, @Req() req: any) {
    const tenantId = this.requireTenantId(req);
    return this.candidateService.create(dto, tenantId);
  }

  private requireTenantId(req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new ForbiddenException('当前账号缺少租户信息，请先完成租户初始化');
    }
    return tenantId;
  }

  private extractTokenFromRequest(req: any) {
    const authHeader = req?.headers?.authorization || req?.headers?.Authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice('Bearer '.length).trim();
    }

    const cookieHeader = req?.headers?.cookie;
    if (typeof cookieHeader !== 'string') return '';

    const tokenCookie = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('token='));

    return tokenCookie ? decodeURIComponent(tokenCookie.slice('token='.length)) : '';
  }
}
