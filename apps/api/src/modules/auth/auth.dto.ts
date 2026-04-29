import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsObject,
  ValidateNested,
  IsOptional,
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
  @IsEmail()
  email: string;

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
  layout?: any;
}

export class UpdateLayoutDto {
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => LayoutConfigDto)
  layout: Record<string, LayoutConfigDto>;
}
