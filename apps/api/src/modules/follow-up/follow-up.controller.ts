import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { FollowUpService } from './follow-up.service';
import { CreateFollowUpDto, GenerateFollowUpStrategyDto } from './follow-up.dto';

@Controller('follow-ups')
export class FollowUpController {
  constructor(private readonly followUpService: FollowUpService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Query('targetType') targetType?: string,
    @Query('targetId') targetId?: string,
  ) {
    const tenantId = req.user?.tenantId;
    return this.followUpService.findAll(Number(page), Number(pageSize), targetType, targetId, tenantId);
  }

  @Post()
  create(@Body() dto: CreateFollowUpDto, @Req() req: any) {
    const userId = req.user?.id || 'system';
    const tenantId = req.user?.tenantId;
    return this.followUpService.create(dto, tenantId, userId);
  }

  @Post('ai-strategy')
  generateStrategy(@Body() dto: GenerateFollowUpStrategyDto) {
    return this.followUpService.generateStrategy(dto);
  }
}
