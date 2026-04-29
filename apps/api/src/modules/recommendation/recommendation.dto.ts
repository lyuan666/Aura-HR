import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';
import { RecStatus } from '../../common/constants/status.enums';

export class CreateRecommendationDto {
  @IsUUID()
  candidateId: string;

  @IsUUID()
  jobId: string;
}

export class UpdateRecommendationStatusDto {
  @IsEnum(RecStatus)
  status: string;
}

export class ScheduleInterviewDto {
  @IsDateString()
  interviewDate: string;
}

export class CreateInterviewReportDto {
  @IsString()
  @IsNotEmpty()
  interviewText: string;
}
