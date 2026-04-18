import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ShareService } from './share.service';
import { Public } from '../../common/decorators/public.decorator';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

class GenerateShareDto {
  @IsString()
  recommendationId: string;

  @IsOptional()
  @IsBoolean()
  isAnonymized?: boolean;
}

class FeedbackDto {
  @IsString()
  feedback: string;
}

@Controller('share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Post('generate')
  generate(@Body() body: GenerateShareDto) {
    return this.shareService.createShareLink(body.recommendationId, body.isAnonymized);
  }

  @Public()
  @Get(':token')
  getPublicData(@Param('token') token: string) {
    return this.shareService.getShareData(token);
  }

  @Public()
  @Post(':token/feedback')
  feedback(@Param('token') token: string, @Body() body: FeedbackDto) {
    return this.shareService.submitFeedback(token, body.feedback);
  }
}
