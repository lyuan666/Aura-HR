import { Controller, Get, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  getOverview(@Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.analyticsService.getOverview(tenantId);
  }

  @Get('talent-stats')
  getTalentStats(@Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.analyticsService.getTalentStats(tenantId);
  }

  @Get('delivery-funnel')
  getDeliveryFunnel(@Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.analyticsService.getDeliveryFunnel(tenantId);
  }
}
