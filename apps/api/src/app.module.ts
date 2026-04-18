import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { CandidateModule } from './modules/candidate/candidate.module';
import { AiModule } from './modules/ai/ai.module';
import { EnterpriseModule } from './modules/enterprise/enterprise.module';
import { EmbeddingModule } from './modules/embedding/embedding.module';
import { JobModule } from './modules/job/job.module';
import { MatchingModule } from './modules/matching/matching.module';
import { RecommendationModule } from './modules/recommendation/recommendation.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ShareModule } from './modules/share/share.module';
import { ScheduleModule } from '@nestjs/schedule';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { FollowUpModule } from './modules/follow-up/follow-up.module';
import {
  UserEntity,
  CandidateEntity,
  EnterpriseEntity,
  ContactEntity,
  JobPositionEntity,
  RecommendationEntity,
  ContractEntity,
  InvoiceEntity,
  FollowUpEntity,
  AuditLogEntity,
  ShareLinkEntity,
} from './entities';

@Module({
  imports: [
    // 环境变量
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),

    // 定时任务
    ScheduleModule.forRoot(),

    // 数据库
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER || 'yzschros',
      password: process.env.DATABASE_PASSWORD || 'yzschros_dev_2026',
      database: process.env.DATABASE_NAME || 'yzschros',
      entities: [
        UserEntity,
        CandidateEntity,
        EnterpriseEntity,
        ContactEntity,
        JobPositionEntity,
        RecommendationEntity,
        ContractEntity,
        InvoiceEntity,
        FollowUpEntity,
        AuditLogEntity,
        ShareLinkEntity,
      ],
      synchronize: true, // 强制开启以校准物理表结构，解决 500 报错
      logging: process.env.NODE_ENV !== 'production',
    }),

    // 业务模块
    AuthModule,
    CandidateModule,
    AiModule,
    EnterpriseModule,
    EmbeddingModule,
    JobModule,
    MatchingModule,
    RecommendationModule,
    AnalyticsModule,
    ShareModule,
    InvoiceModule,
    FollowUpModule,
  ],
})
export class AppModule {}
