import { IsString, IsNotEmpty, IsOptional, IsEmail, IsBoolean, IsIn } from 'class-validator';

export class CreateEnterpriseDto {
  @IsString()
  @IsNotEmpty({ message: '企业名称不能为空' })
  name: string;

  @IsString()
  @IsOptional()
  industry?: string;

  @IsString()
  @IsOptional()
  scale?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  contactName?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  contactTitle?: string;
}

export class CreateContactDto {
  @IsString()
  @IsNotEmpty({ message: '联系人姓名不能为空' })
  name: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  wechat?: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class UpdateEnterpriseStatusDto {
  @IsIn(['potential', 'following', 'negotiating', 'signed', 'churned'], {
    message: '非法的业务状态',
  })
  status: 'potential' | 'following' | 'negotiating' | 'signed' | 'churned';
}
