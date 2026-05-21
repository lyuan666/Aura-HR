import { Controller, Get, Post, Patch, Param, Body, Query, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContractService } from './contract.service';

@Controller('contracts')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('enterpriseId') enterpriseId?: string,
    @Query('status') status?: string,
  ) {
    return this.contractService.findAll(
      Number(page),
      Number(pageSize),
      req.user,
      { enterpriseId, status },
    );
  }

  @Get('enterprise/:enterpriseId/stats')
  getEnterpriseStats(@Param('enterpriseId') enterpriseId: string, @Req() req: any) {
    return this.contractService.getEnterpriseStats(enterpriseId, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.contractService.findOne(id, req.user);
  }

  @Post()
  create(@Body() dto: any, @Req() req: any) {
    return this.contractService.create(dto, req.user);
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
    return this.contractService.uploadAndCreate(file, body, req.user);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string, @Req() req: any) {
    return this.contractService.updateStatus(id, status, req.user);
  }
}
