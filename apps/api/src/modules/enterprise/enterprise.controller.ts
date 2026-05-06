import { Controller, Get, Post, Patch, Body, Param, Req, Query } from '@nestjs/common';
import { EnterpriseService } from './enterprise.service';
import {
  CreateEnterpriseDto,
  CreateContactDto,
  UpdateEnterpriseStatusDto,
} from './enterprise.dto';

@Controller('enterprises')
export class EnterpriseController {
  constructor(private readonly enterpriseService: EnterpriseService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Query('name') name?: string,
    @Query('status') status?: string,
  ) {
    const tenantId = req.user?.tenantId;
    return this.enterpriseService.findAll(Number(page), Number(pageSize), tenantId, {
      name,
      status,
    });
  }

  @Post()
  create(@Body() dto: CreateEnterpriseDto, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.enterpriseService.create(dto, tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.enterpriseService.findOne(id, tenantId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateEnterpriseStatusDto,
    @Req() req: any,
  ) {
    const tenantId = req.user?.tenantId;
    return this.enterpriseService.updateStatus(id, dto, tenantId);
  }

  @Post(':id/contacts')
  addContact(@Param('id') id: string, @Body() dto: CreateContactDto, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.enterpriseService.addContact(id, dto, tenantId);
  }
}
