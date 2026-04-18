import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ShareService } from './share.service';

@Controller('share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Post('generate')
  generate(@Body() body: { recommendationId: string; isAnonymized?: boolean }) {
    return this.shareService.createShareLink(body.recommendationId, body.isAnonymized);
  }

  @Get(':token')
  getPublicData(@Param('token') token: string) {
    return this.shareService.getShareData(token);
  }

  @Post(':token/feedback')
  feedback(@Param('token') token: string, @Body() body: { feedback: string }) {
    return this.shareService.submitFeedback(token, body.feedback);
  }
}
