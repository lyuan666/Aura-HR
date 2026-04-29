import { Controller, Get, Post, Body, Param, Req, Query, Patch } from '@nestjs/common';
import { GuaranteeService } from './guarantee.service';

@Controller('guarantees')
export class GuaranteeController {
  constructor(private readonly guaranteeService: GuaranteeService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    const tenantId = req.user?.tenantId;
    return this.guaranteeService.findAll(Number(page), Number(pageSize), tenantId);
  }

  @Post(':id/fail')
  markAsFailed(
    @Param('id') recId: string,
    @Body('reason') reason: string,
    @Req() req: any,
  ) {
    const tenantId = req.user?.tenantId;
    return this.guaranteeService.markAsFailed(recId, reason, tenantId);
  }
}
