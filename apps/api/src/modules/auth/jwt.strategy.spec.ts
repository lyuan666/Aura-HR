import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { UserEntity } from '../../entities/user.entity';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepo: any;

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (user) => user),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('secret') },
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: userRepo,
        },
      ],
    }).compile();

    strategy = module.get(JwtStrategy);
  });

  it('rejects hr_client without tenantId', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'u1',
      email: 'hr@example.com',
      role: 'hr_client',
      isActive: true,
      enterpriseId: 'e1',
    });

    await expect(strategy.validate({ sub: 'u1', email: 'hr@example.com', role: 'hr_client' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects hr_client without enterpriseId', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'u1',
      email: 'hr@example.com',
      role: 'hr_client',
      isActive: true,
      tenantId: 't1',
    });

    await expect(strategy.validate({ sub: 'u1', email: 'hr@example.com', role: 'hr_client' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('allows consultant tenant fallback behavior', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'u2',
      email: 'c@example.com',
      role: 'consultant',
      isActive: true,
    });

    await expect(strategy.validate({ sub: 'u2', email: 'c@example.com', role: 'consultant' })).resolves.toMatchObject({
      sub: 'u2',
      role: 'consultant',
      tenantId: expect.any(String),
    });
  });
});
