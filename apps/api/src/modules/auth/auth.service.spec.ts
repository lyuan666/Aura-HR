import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { UserEntity } from '../../entities/user.entity';
import { RefreshTokenEntity } from '../../entities/refresh-token.entity';
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
          provide: getRepositoryToken(RefreshTokenEntity),
          useValue: {
            create: jest.fn().mockImplementation(dto => dto),
            save: jest.fn().mockImplementation(t => Promise.resolve({ id: 'rt1', ...t })),
            findOne: jest.fn(),
            update: jest.fn(),
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

  it('should login with email and include tenantId in token payload', async () => {
    const dto = { account: 'test@example.com', password: 'password123' };
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const mockUser = { id: 'u1', email: dto.account, password: hashedPassword, tenantId: 't1', isActive: true };

    jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as any);

    const result = await service.login(dto);

    expect(jwtService.sign).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: 't1',
    }));
    expect(result.user.id).toBe('u1');
  });

  it('should login with phone number', async () => {
    const dto = { account: '13248880301', password: 'password123' };
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const mockUser = { id: 'u2', phone: dto.account, password: hashedPassword, tenantId: 't1', isActive: true };

    jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as any);

    const result = await service.login(dto);

    expect(userRepo.findOne).toHaveBeenCalledWith({ where: { phone: dto.account } });
    expect(result.user.id).toBe('u2');
  });

  it('should reject login with wrong password', async () => {
    const dto = { account: 'test@example.com', password: 'wrongpassword' };
    const hashedPassword = await bcrypt.hash('password123', 10);
    const mockUser = { id: 'u1', email: dto.account, password: hashedPassword, tenantId: 't1', isActive: true };

    jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as any);

    await expect(service.login(dto)).rejects.toThrow('账号或密码错误');
  });

  it('should reject login for non-existent account', async () => {
    const dto = { account: 'nobody@example.com', password: 'password123' };
    jest.spyOn(userRepo, 'findOne').mockResolvedValue(null);

    await expect(service.login(dto)).rejects.toThrow('账号或密码错误');
  });
});
