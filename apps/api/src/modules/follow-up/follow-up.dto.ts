import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class CreateFollowUpDto {
  @IsEnum(['candidate', 'enterprise'])
  targetType: string;

  @IsString()
  @IsNotEmpty()
  targetId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsDateString()
  @IsOptional()
  nextFollowUpAt?: string;
}

export class GenerateFollowUpStrategyDto {
  @IsEnum(['candidate', 'enterprise'])
  targetType: string;

  @IsString()
  @IsNotEmpty()
  targetId: string;
}
