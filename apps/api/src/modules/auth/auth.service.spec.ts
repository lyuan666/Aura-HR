import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { UserEntity } from '../../entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: Repository<UserEntity>;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn().mockImplementation(dto => dto),
            save: jest.fn().mockImplementation(u => Promise.resolve({ id: 'u1', ...u })),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('secret'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should register a new user with hashed password', async () => {
    const dto = { email: 'test@example.com', password: 'password123', name: 'Test User' };
    jest.spyOn(userRepo, 'findOne').mockResolvedValue(null);

    const result = await service.register(dto as any);

    expect(userRepo.create).toHaveBeenCalled();
    expect(jwtService.sign).toHaveBeenCalledWith(expect.objectContaining({
      email: dto.email,
    }));
    expect(result.accessToken).toBe('mock-token');
  });

  it('should login and include tenantId in token payload', async () => {
    const dto = { email: 'test@example.com', password: 'password123' };
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const mockUser = { id: 'u1', email: dto.email, password: hashedPassword, tenantId: 't1', isActive: true };
    
    jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as any);

    const result = await service.login(dto);

    expect(jwtService.sign).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: 't1',
    }));
    expect(result.user.id).toBe('u1');
  });
});
