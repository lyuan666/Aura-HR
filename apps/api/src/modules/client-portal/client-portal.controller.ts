import { Controller, Get, Post, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClientPortalService } from './client-portal.service';

@Controller('client-portal')
@UseGuards(JwtAuthGuard)
export class ClientPortalController {
  constructor(private readonly clientPortalService: ClientPortalService) {}

  private checkRole(req: any) {
    if (req.user.role !== 'hr_client' && req.user.role !== 'admin') {
      throw new ForbiddenException('仅限甲方客户访问');
    }
  }

  @Get('jobs')
  async getJobs(@Req() req: any) {
    this.checkRole(req);
    const enterpriseId = req.user.enterpriseId;
    return await this.clientPortalService.getEnterpriseJobs(enterpriseId);
  }

  @Post('jobs')
  async createJob(@Req() req: any, @Body() data: any) {
    this.checkRole(req);
    const enterpriseId = req.user.enterpriseId;
    const tenantId = req.user.tenantId;
    return await this.clientPortalService.createEnterpriseJob(enterpriseId, tenantId, data);
  }

  @Get('recommendations')
  async getRecommendations(@Req() req: any) {
    this.checkRole(req);
    const enterpriseId = req.user.enterpriseId;
    return await this.clientPortalService.getEnterpriseRecommendations(enterpriseId);
  }

  @Post('recommendations/:id/status')
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    this.checkRole(req);
    const enterpriseId = req.user.enterpriseId;
    return await this.clientPortalService.updateRecommendationStatus(enterpriseId, id, status);
  }
}
