import { Controller, Get, Post, Patch, Param, Body, Query, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContractService } from './contract.service';

@Controller('contracts')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Get()
  findAll(@Req() req: any, @Query('page') page = 1, @Query('pageSize') pageSize = 20) {
    const tenantId = req.user?.tenantId;
    return this.contractService.findAll(Number(page), Number(pageSize), tenantId);
  }

  @Get('templates')
  getTemplates() {
    return this.contractService.getTemplates();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.contractService.findOne(id, tenantId);
  }

  @Post()
  create(@Body() dto: any, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.contractService.create(dto, tenantId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  async uploadContract(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('请上传合同文件');
    }
    const tenantId = req.user?.tenantId;
    return this.contractService.uploadAndCreate(file, body, tenantId);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.contractService.updateStatus(id, status, tenantId);
  }
}
