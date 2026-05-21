import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ContractTemplateService } from './contract-template.service';

@Controller('contracts/templates')
export class ContractTemplateController {
  constructor(private readonly templateService: ContractTemplateService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.templateService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.templateService.findOne(id, req.user);
  }

  @Post()
  create(@Body() dto: any, @Req() req: any) {
    if (req.user?.role !== 'admin' && req.user?.role !== 'manager') {
      throw new ForbiddenException('仅系统管理员与企业管理员可以创建合同模板');
    }
    return this.templateService.create(dto, req.user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    if (req.user?.role !== 'admin' && req.user?.role !== 'manager') {
      throw new ForbiddenException('仅系统管理员与企业管理员可以修改合同模板');
    }
    return this.templateService.update(id, dto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    if (req.user?.role !== 'admin' && req.user?.role !== 'manager') {
      throw new ForbiddenException('仅系统管理员与企业管理员可以删除合同模板');
    }
    return this.templateService.remove(id, req.user);
  }
}
