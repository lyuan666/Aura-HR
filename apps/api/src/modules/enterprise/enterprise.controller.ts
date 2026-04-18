import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
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
  findAll() {
    return this.enterpriseService.findAll();
  }

  @Post()
  create(@Body() dto: CreateEnterpriseDto) {
    return this.enterpriseService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enterpriseService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateEnterpriseStatusDto,
  ) {
    return this.enterpriseService.updateStatus(id, dto);
  }

  @Post(':id/contacts')
  addContact(@Param('id') id: string, @Body() dto: CreateContactDto) {
    return this.enterpriseService.addContact(id, dto);
  }
}
