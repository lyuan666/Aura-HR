import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
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
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
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
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),

    ScheduleModule.forRoot(),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER || 'yzschros',
      password: process.env.DATABASE_PASSWORD,
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
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV !== 'production',
    }),

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
  providers: [
    // 全局 JWT 认证守卫，所有端点默认需要认证
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
