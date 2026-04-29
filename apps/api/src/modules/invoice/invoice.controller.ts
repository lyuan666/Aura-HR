import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto, UpdateInvoiceStatusDto, ConfirmPaymentDto } from './invoice.dto';

@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    const tenantId = req.user?.tenantId;
    return this.invoiceService.findAll(Number(page), Number(pageSize), tenantId);
  }

  @Get('contract/:contractId')
  findByContract(@Param('contractId') contractId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.invoiceService.findByContract(contractId, tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.invoiceService.findOne(id, tenantId);
  }

  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.invoiceService.create(createInvoiceDto, tenantId);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateInvoiceStatusDto, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.invoiceService.updateStatus(id, dto, tenantId);
  }

  @Post(':id/payment')
  confirmPayment(@Param('id') id: string, @Body() dto: ConfirmPaymentDto, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.invoiceService.confirmPayment(id, dto, tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.invoiceService.remove(id, tenantId);
  }
}
