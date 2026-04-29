import { Controller, Get, Post, Patch, Body, Param, NotFoundException, Req, Query } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';

@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Post()
  create(@Body() body: { candidateId: string; jobId: string }, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.recommendationService.createRecommendation(body.candidateId, body.jobId, tenantId);
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    const tenantId = req.user?.tenantId;
    return this.recommendationService.findAll(Number(page), Number(pageSize), tenantId);
  }

  @Get(':id/report')
  getReport(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.recommendationService.getMatchReport(id, tenantId);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.recommendationService.updateStatus(id, body.status, tenantId);
  }

  @Patch(':id/schedule')
  updateSchedule(@Param('id') id: string, @Body() body: { interviewDate: Date }, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.recommendationService.updateSchedule(id, body.interviewDate, tenantId);
  }

  @Get(':id/outreach')
  getOutreach(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.recommendationService.getOutreachMessage(id, tenantId);
  }

  @Post(':id/interview-report')
  createInterviewReport(
    @Param('id') id: string,
    @Body('interviewText') interviewText: string,
    @Req() req: any,
  ) {
    const tenantId = req.user?.tenantId;
    return this.recommendationService.createInterviewReport(id, interviewText, tenantId);
  }
}
