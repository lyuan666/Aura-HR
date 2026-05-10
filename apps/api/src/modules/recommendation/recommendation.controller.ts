import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { PageQueryDto } from '../../common/dto/page-query.dto';
import {
  CreateInterviewReportDto,
  CreateRecommendationDto,
  ScheduleInterviewDto,
  UpdateRecommendationStatusDto,
} from './recommendation.dto';

@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Post()
  create(@Body() body: CreateRecommendationDto, @Req() req: any) {
    const tenantId = this.requireTenantId(req);
    return this.recommendationService.createRecommendation(
      body.candidateId,
      body.jobId,
      req.user.sub,
      tenantId,
    );
  }

  @Get()
  findAll(@Req() req: any, @Query() query: PageQueryDto & { status?: string; startDate?: string; endDate?: string }) {
    const tenantId = this.requireTenantId(req);
    return this.recommendationService.findAll(
      query.page,
      query.pageSize,
      tenantId,
      { status: query.status, startDate: query.startDate, endDate: query.endDate },
    );
  }

  @Get(':id/report')
  getReport(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.requireTenantId(req);
    return this.recommendationService.getMatchReport(id, tenantId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateRecommendationStatusDto,
    @Req() req: any,
  ) {
    const tenantId = this.requireTenantId(req);
    return this.recommendationService.updateStatus(id, body.status, tenantId);
  }

  @Patch(':id/schedule')
  updateSchedule(
    @Param('id') id: string,
    @Body() body: ScheduleInterviewDto,
    @Req() req: any,
  ) {
    const tenantId = this.requireTenantId(req);
    return this.recommendationService.updateSchedule(
      id,
      body.interviewDate,
      tenantId,
    );
  }

  @Get(':id/outreach')
  getOutreach(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.requireTenantId(req);
    return this.recommendationService.getOutreachMessage(id, tenantId);
  }

  @Post(':id/interview-report')
  createInterviewReport(
    @Param('id') id: string,
    @Body() body: CreateInterviewReportDto,
    @Req() req: any,
  ) {
    const tenantId = this.requireTenantId(req);
    return this.recommendationService.createInterviewReport(
      id,
      body.interviewText,
      tenantId,
    );
  }

  private requireTenantId(req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new ForbiddenException('当前账号缺少租户信息，请先完成租户初始化');
    }
    return tenantId;
  }
}
