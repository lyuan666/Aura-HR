import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnterpriseController } from './enterprise.controller';
import { EnterpriseService } from './enterprise.service';
import { EnterpriseEntity } from '../../entities/enterprise.entity';
import { ContactEntity } from '../../entities/contact.entity';
import { FollowUpEntity } from '../../entities/follow-up.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EnterpriseEntity, ContactEntity, FollowUpEntity]),
  ],
  controllers: [EnterpriseController],
  providers: [EnterpriseService],
  exports: [EnterpriseService],
})
export class EnterpriseModule {}
