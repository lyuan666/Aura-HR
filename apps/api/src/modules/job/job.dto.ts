import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber } from 'class-validator';

export class CreateJobDto {
  @IsUUID()
  @IsOptional()
  enterpriseId?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  salaryMin?: number;

  @IsNumber()
  @IsOptional()
  salaryMax?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  requirements?: string;
}

export class UpdateJobDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  salaryMin?: number;

  @IsNumber()
  @IsOptional()
  salaryMax?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  requirements?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
