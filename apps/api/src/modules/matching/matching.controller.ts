import { Controller, Get, Param } from '@nestjs/common';
import { MatchingService } from './matching.service';

@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('jobs/:jobId')
  async getBestMatches(@Param('jobId') jobId: string) {
    return this.matchingService.findBestMatches(jobId);
  }
}
