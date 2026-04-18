import { IsString, IsOptional, IsNumber, IsArray, IsObject } from 'class-validator';

export class CreateCandidateDto {
  @IsString()
  name: string;

  @IsString()
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

  @IsString()
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
