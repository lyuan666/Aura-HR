import { Controller, Get, Param, Res, Req, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ReportService } from './report.service';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('recommendation/:id')
  async getRecommendationReport(
    @Param('id') id: string,
    @Res() res: Response,
    @Req() req: any,
  ) {
    const tenantId = req.user?.tenantId;
    const buffer = await this.reportService.generateRecommendationReport(id, tenantId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=recommendation-report-${id}.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
