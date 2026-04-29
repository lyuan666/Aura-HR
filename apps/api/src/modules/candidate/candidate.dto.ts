import {
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { CandidateStatus } from '../../common/constants/status.enums';

export enum CandidateGender {
  Male = 'male',
  Female = 'female',
  Unknown = 'unknown',
}

export class CreateCandidateDto {
  @IsString()
  name: string;

  @IsEnum(CandidateGender)
  @IsOptional()
  gender?: string;

  @IsNumber()
  @IsOptional()
  age?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  wechat?: string;

  @IsString()
  @IsOptional()
  currentCompany?: string;

  @IsString()
  @IsOptional()
  currentTitle?: string;

  @IsNumber()
  @IsOptional()
  totalYears?: number;

  @IsNumber()
  @IsOptional()
  currentSalary?: number;

  @IsNumber()
  @IsOptional()
  expectedSalary?: number;

  @IsString()
  @IsOptional()
  degree?: string;

  @IsString()
  @IsOptional()
  school?: string;

  @IsString()
  @IsOptional()
  major?: string;

  @IsObject()
  @IsOptional()
  parsedTags?: Record<string, any>;

  @IsArray()
  @IsOptional()
  workExperiences?: any[];

  @IsArray()
  @IsOptional()
  projectExperiences?: any[];

  @IsObject()
  @IsOptional()
  careerExpectations?: any;

  @IsArray()
  @IsOptional()
  educationHistory?: any[];

  @IsString()
  @IsOptional()
  sourcePlatform?: string;

  @IsString()
  @IsOptional()
  importedBy?: string;

  @IsEnum(CandidateStatus)
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  resumeUrl?: string;

  @IsString()
  @IsOptional()
  resumeText?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
