import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsDateString } from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  contractId: string;

  @IsString()
  @IsNotEmpty()
  invoiceNo: string;

  @IsNumber()
  amount: number;

  @IsDateString()
  issueDate: string;

  @IsDateString()
  dueDate: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateInvoiceStatusDto {
  @IsEnum(['pending', 'issued', 'sent', 'paid', 'overdue', 'cancelled'])
  status: string;
}

export class ConfirmPaymentDto {
  @IsDateString()
  paidDate: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
