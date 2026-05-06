import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsObject,
  ValidateNested,
  IsOptional,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  account: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class LayoutConfigDto {
  @IsString()
  @IsOptional()
  key?: string;

  @IsOptional()
  layout?: unknown;
}

export class UpdateLayoutDto {
  @IsObject()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LayoutConfigDto)
  layout?: Record<string, LayoutConfigDto>;

  @IsObject()
  @IsOptional()
  layouts?: Record<string, unknown>;

  @IsArray()
  @IsOptional()
  visibleWidgets?: string[];
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}

export class UpdateSettingsConfigDto {
  @IsBoolean()
  @IsOptional()
  mfa?: boolean;

  @IsBoolean()
  @IsOptional()
  auditLog?: boolean;

  @IsBoolean()
  @IsOptional()
  apiKey?: boolean;

  @IsBoolean()
  @IsOptional()
  glm4?: boolean;

  @IsBoolean()
  @IsOptional()
  deepParse?: boolean;

  @IsBoolean()
  @IsOptional()
  autoInvite?: boolean;
}
