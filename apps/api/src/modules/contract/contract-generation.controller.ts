import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  BadRequestException,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { ContractGenerationService } from './contract-generation.service';

@Controller('contracts/generations')
export class ContractGenerationController {
  constructor(private readonly generationService: ContractGenerationService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
  ) {
    return this.generationService.findAll(req.user, Number(page), Number(pageSize));
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.generationService.findOne(id, req.user);
  }

  @Post()
  create(@Body() dto: any, @Req() req: any) {
    return this.generationService.create(dto, req.user);
  }

  @Patch(':id/content')
  updateContent(
    @Param('id') id: string,
    @Body('editedContent') editedContent: string,
    @Req() req: any,
  ) {
    if (editedContent === undefined || editedContent === null) {
      throw new BadRequestException('缺失富文本修改内容 (editedContent)');
    }
    return this.generationService.updateContent(id, editedContent, req.user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Req() req: any,
  ) {
    if (!status) {
      throw new BadRequestException('缺失状态值 (status)');
    }
    return this.generationService.updateStatus(id, status, req.user);
  }

  @Sse(':id/assess-risk')
  assessRisk(@Param('id') id: string, @Req() req: any) {
    return this.generationService.assessRiskStream(id, req.user).pipe(
      map(data => ({ data } as MessageEvent)),
    );
  }

  @Post(':id/formalize')
  formalize(@Param('id') id: string, @Req() req: any) {
    return this.generationService.formalize(id, req.user);
  }
}
