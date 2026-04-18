import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('talent-stats')
  getTalentStats() {
    return this.analyticsService.getTalentStats();
  }

  @Get('delivery-funnel')
  getDeliveryFunnel() {
    return this.analyticsService.getDeliveryFunnel();
  }
}
