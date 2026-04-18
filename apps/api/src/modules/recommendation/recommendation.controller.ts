import { Controller, Get, Post, Patch, Body, Param, NotFoundException } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';

@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Post()
  create(@Body() body: { candidateId: string; jobId: string }) {
    return this.recommendationService.createRecommendation(body.candidateId, body.jobId);
  }

  @Get()
  findAll() {
    return this.recommendationService.findAll();
  }

  @Get(':id/report')
  getReport(@Param('id') id: string) {
    return this.recommendationService.getMatchReport(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.recommendationService.updateStatus(id, body.status);
  }

  @Patch(':id/schedule')
  updateSchedule(@Param('id') id: string, @Body() body: { interviewDate: Date }) {
    return this.recommendationService.updateSchedule(id, body.interviewDate);
  }

  @Get(':id/outreach')
  getOutreach(@Param('id') id: string) {
    return this.recommendationService.getOutreachMessage(id);
  }

  @Post(':id/interview-report')
  createInterviewReport(
    @Param('id') id: string,
    @Body('interviewText') interviewText: string,
  ) {
    return this.recommendationService.createInterviewReport(id, interviewText);
  }
}
