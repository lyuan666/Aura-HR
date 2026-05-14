import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateExtensionCaptureDto {
  @IsString()
  sourcePlatform: string;

  @IsString()
  sourceUrl: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  rawText: string;

  @IsString()
  @IsOptional()
  sourceRecordId?: string;

  @IsString()
  @IsOptional()
  traceId?: string;
}

export class ReviewStagingCandidateDto {
  @IsIn(['reject', 'review', 'candidate'])
  decision: 'reject' | 'review' | 'candidate';

  @IsString()
  @IsOptional()
  rejectReason?: string;
}
