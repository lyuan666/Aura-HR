import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('refresh_tokens')
@Index(['tokenHash'])
@Index(['userId'])
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  tokenHash: string;

  @Column({ default: false })
  isRevoked: boolean;

  @Column({ nullable: true })
  familyId: string;

  @CreateDateColumn()
  createdAt: Date;
}
