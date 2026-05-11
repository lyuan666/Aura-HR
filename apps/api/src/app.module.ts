import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
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
import { QueueModule } from './modules/queue/queue.module';
import { StorageModule } from './modules/storage/storage.module';
import { RedisModule } from './modules/redis/redis.module';
import { ReportModule } from './modules/report/report.module';
import { GuaranteeModule } from './modules/guarantee/guarantee.module';
import { ContractModule } from './modules/contract/contract.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AuthClientModule } from './modules/auth-client/auth-client.module';
import { ClientPortalModule } from './modules/client-portal/client-portal.module';
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
  PendingJobEntity,
  GuaranteeTrackingEntity,
  RefreshTokenEntity,
  NotificationConfigEntity,
} from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST') || 'localhost',
        port: parseInt(configService.get('DATABASE_PORT') || '5432', 10),
        username: configService.get('DATABASE_USER') || 'yzschros',
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME') || 'yzschros',
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
          PendingJobEntity,
          GuaranteeTrackingEntity,
          RefreshTokenEntity,
          NotificationConfigEntity,
        ],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') !== 'production',
        poolSize: 20,
        extra: {
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        },
      }),
    }),

    RedisModule,
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
    QueueModule,
    StorageModule,
    ReportModule,
    GuaranteeModule,
    ContractModule,
    NotificationModule,
    AuthClientModule,
    ClientPortalModule,
  ],
  providers: [
    // 全局 JWT 认证守卫，所有端点默认需要认证
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
