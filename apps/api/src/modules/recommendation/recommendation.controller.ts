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
    if (req.user?.role === 'hr_client') {
      throw new ForbiddenException('客户 HR 账号不能创建推荐');
    }
    const tenantId = this.requireTenantId(req);
    return this.recommendationService.createRecommendation(
      body.candidateId,
      body.jobId,
      req.user.sub,
      tenantId,
    );
  }

  @Get()
  findAll(@Req() req: any, @Query() query: PageQueryDto) {
    const tenantId = this.requireTenantId(req);
    return this.recommendationService.findAll(
      query.page,
      query.pageSize,
      tenantId,
    );
  }

  @Get('client')
  findClientRecommendations(@Req() req: any, @Query() query: PageQueryDto) {
    const { tenantId, enterpriseId } = this.requireClientScope(req);
    return this.recommendationService.findClientRecommendations(
      tenantId,
      enterpriseId,
      query.page,
      query.pageSize,
    );
  }

  @Get('client/portal')
  findClientPortal(@Req() req: any) {
    const { tenantId, enterpriseId } = this.requireClientScope(req);
    return this.recommendationService.getClientPortalContext(tenantId, enterpriseId);
  }

  @Get('client/:id')
  findClientRecommendationDetail(@Param('id') id: string, @Req() req: any) {
    const { tenantId, enterpriseId } = this.requireClientScope(req);
    return this.recommendationService.findClientRecommendationDetail(id, tenantId, enterpriseId);
  }

  @Post('client/:id/feedback')
  submitClientFeedback(
    @Param('id') id: string,
    @Body('feedback') feedback: string,
    @Req() req: any,
  ) {
    const { tenantId, enterpriseId } = this.requireClientScope(req);
    return this.recommendationService.submitClientFeedback(id, tenantId, enterpriseId, feedback);
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

  private requireClientScope(req: any) {
    if (req.user?.role !== 'hr_client') {
      throw new ForbiddenException('仅客户 HR 可访问该资源');
    }
    const tenantId = this.requireTenantId(req);
    const enterpriseId = req.user?.enterpriseId;
    if (!enterpriseId) {
      throw new ForbiddenException('当前客户 HR 账号缺少企业范围');
    }
    return { tenantId, enterpriseId };
  }
}
