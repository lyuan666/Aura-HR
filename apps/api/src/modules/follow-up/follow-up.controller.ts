import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { FollowUpService } from './follow-up.service';
import { CreateFollowUpDto, GenerateFollowUpStrategyDto } from './follow-up.dto';

@Controller('follow-ups')
export class FollowUpController {
  constructor(private readonly followUpService: FollowUpService) {}

  @Get()
  findAll(
    @Query('targetType') targetType?: string,
    @Query('targetId') targetId?: string,
  ) {
    return this.followUpService.findAll(targetType, targetId);
  }

  @Post()
  create(@Body() dto: CreateFollowUpDto, @Req() req: any) {
    // 实际应从 JWT 中获取 userId，此处简化
    const userId = req.user?.id || 'system';
    return this.followUpService.create(dto, userId);
  }

  @Post('ai-strategy')
  generateStrategy(@Body() dto: GenerateFollowUpStrategyDto) {
    return this.followUpService.generateStrategy(dto);
  }
}
