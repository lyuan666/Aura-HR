import { Controller, Get, Post, Body, Param, Patch, UseInterceptors, UploadedFile, Req, Query, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JobService } from './job.service';
import { AiService } from '../ai/ai.service';
import { CreateJobDto, UpdateJobDto } from './job.dto';
@Controller('job-positions')
export class JobController {
  constructor(
    private readonly jobService: JobService,
    private readonly aiService: AiService,
  ) {}

  @Post()
  async create(@Body() dto: CreateJobDto, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.jobService.create(dto, tenantId);
  }

  @Post('parse')
  @UseInterceptors(FileInterceptor('file'))
  async parseJd(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('请上传文件');
    return this.aiService.parseFile(file.buffer, file.originalname, 'jd');
  }

  @Post('parse-text')
  async parseJdText(@Body('text') text: string) {
    try {
      return await this.aiService.parseJobDescription(text);
    } catch {
      return this.buildFallbackParsedJob(text);
    }
  }

  @Post('generate')
  async generateJd(
    @Body('info') info: string,
    @Body('responsibilities') responsibilities: string,
    @Body('skills') skills: string,
  ) {
    return this.aiService.generateJobDescription(info, responsibilities, skills);
  }

  @Get()
  async findAll(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    const tenantId = req.user?.tenantId;
    return this.jobService.findAll(Number(page), Number(pageSize), tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.jobService.findOne(id, tenantId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateJobDto, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.jobService.update(id, dto, tenantId);
  }

  private buildFallbackParsedJob(text = '') {
    const summary = text.trim();
    const titleMatch = summary.match(
      /(?:招聘|招|需要|寻找|想招聘)(?:一个|一名|1名)?([^，,。.\n]{2,24}?)(?:的岗位|岗位|职位|，|,|。|\.|\n|$)/,
    );
    const title =
      titleMatch?.[1]?.trim() ||
      summary.split(/[\n，,。.\s]/).find(Boolean) ||
      '未命名职位';

    return {
      title,
      summary,
      requiredSkills: [],
    };
  }
}
