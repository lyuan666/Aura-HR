import { Controller, Get, Post, Body, Param, Patch, UseInterceptors, UploadedFile } from '@nestjs/common';
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
  async create(@Body() dto: CreateJobDto) {
    return this.jobService.create(dto);
  }

  @Post('parse')
  @UseInterceptors(FileInterceptor('file'))
  async parseJd(@UploadedFile() file: any) {
    return this.aiService.parseFile(file.buffer, file.originalname, 'jd');
  }

  @Post('parse-text')
  async parseJdText(@Body('text') text: string) {
    return this.aiService.parseJobDescription(text);
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
  async findAll() {
    return this.jobService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.jobService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateJobDto) {
    return this.jobService.update(id, dto);
  }
}
