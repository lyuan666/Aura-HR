import { Controller, Get, Param, Req } from '@nestjs/common';
import { MatchingService } from './matching.service';

@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('jobs/:jobId')
  async getBestMatches(@Param('jobId') jobId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.matchingService.findBestMatches(jobId, tenantId);
  }
}
