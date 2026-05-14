import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import {
  CreateExtensionAttachmentDto,
  CreateExtensionCaptureDto,
  ReviewStagingCandidateDto,
} from './import.dto';
import { ImportService } from './import.service';

@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('extension-capture')
  createExtensionCapture(@Body() dto: CreateExtensionCaptureDto, @Req() req: any) {
    return this.importService.createExtensionCapture(dto, this.getActor(req));
  }

  @Post('extension-attachment')
  @UseInterceptors(FileInterceptor('resume'))
  createExtensionAttachment(
    @Body() dto: CreateExtensionAttachmentDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    return this.importService.createExtensionAttachment(dto, file, this.getActor(req));
  }

  @Get('batches')
  findBatches(@Req() req: any) {
    return this.importService.findBatches(this.getActor(req).tenantId);
  }

  @Get('staging')
  findStaging(@Req() req: any) {
    return this.importService.findStaging(this.getActor(req).tenantId);
  }

  @Get('staging/:id')
  findStagingDetail(@Param('id') id: string, @Req() req: any) {
    return this.importService.findStagingDetail(id, this.getActor(req).tenantId);
  }

  @Patch('staging/:id/decision')
  updateDecision(
    @Param('id') id: string,
    @Body() dto: ReviewStagingCandidateDto,
    @Req() req: any,
  ) {
    return this.importService.updateDecision(id, dto, this.getActor(req));
  }

  @Post('staging/:id/promote')
  promote(@Param('id') id: string, @Req() req: any) {
    return this.importService.promoteToCandidate(id, this.getActor(req));
  }

  private getActor(req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new ForbiddenException('当前账号缺少租户信息，请先完成租户初始化');
    }
    return {
      tenantId,
      operatorId: req.user?.sub || req.user?.id,
    };
  }
}
