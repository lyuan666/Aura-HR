import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { InvoiceEntity } from '../../entities/invoice.entity';
import { ContractEntity } from '../../entities/contract.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InvoiceEntity, ContractEntity])],
  controllers: [InvoiceController],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoiceModule {}
