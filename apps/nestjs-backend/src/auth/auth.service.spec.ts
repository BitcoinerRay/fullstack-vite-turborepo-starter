import {UnauthorizedException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {JwtService} from '@nestjs/jwt';
import {type User} from '@next-nest-turbo-auth-boilerplate/db';
import {RegisterDto, LoginDto, UserRole} from '@next-nest-turbo-auth-boilerplate/shared';
import {compare, hash} from 'bcrypt';
import {ConfigKey} from '../config/config-key.enum';
import {UsersService} from '../users/users.service';
import {AuthService} from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const hashMock = jest.mocked(hash);
const compareMock = jest.mocked(compare);

const user: User = {
  id: 'user-1',
  email: 'user@example.com',
  passwordHash: 'stored-password-hash',
  role: UserRole.USER,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const userDto = {
  id: user.id,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
};

const refreshSecret = 'refresh-secret-32-chars-or-more!!';

describe('AuthService', () => {
  const usersService = {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmailWithPassword: jest.fn(),
    toDto: jest.fn(() => userDto),
  } as unknown as UsersService;
  const jwtService = {
    sign: jest.fn((_payload: unknown, options?: {secret?: string}) =>
      options?.secret ? 'signed-refresh-token' : 'signed-access-token',
    ),
    verifyAsync: jest.fn(),
  } as unknown as JwtService;
  const configService = {
    get: jest.fn((key: ConfigKey, fallback?: unknown) => {
      if (key === ConfigKey.BCRYPT_SALT_ROUNDS) return 12;
      if (key === ConfigKey.REFRESH_TOKEN_EXPIRES_IN) return '7d';
      return fallback;
    }),
    getOrThrow: jest.fn((key: ConfigKey) => {
      if (key === ConfigKey.REFRESH_TOKEN_SECRET) return refreshSecret;
      throw new Error(`unexpected key ${key}`);
    }),
  } as unknown as ConfigService;

  const service = new AuthService(usersService, jwtService, configService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hashes the password, creates a user, and signs both tokens during registration', async () => {
    const dto: RegisterDto = {email: user.email, password: 'password123'};

    hashMock.mockImplementation(async () => 'hashed-password');
    jest.mocked(usersService.create).mockResolvedValue(user);

    await expect(service.register(dto)).resolves.toEqual({
      user: userDto,
      accessToken: 'signed-access-token',
      refreshToken: 'signed-refresh-token',
    });

    expect(hashMock).toHaveBeenCalledWith(dto.password, 12);
    expect(usersService.create).toHaveBeenCalledWith(dto.email, 'hashed-password');
    expect(jwtService.sign).toHaveBeenCalledTimes(2);
  });

  it('returns the dto and both tokens for valid login credentials', async () => {
    const dto: LoginDto = {email: user.email, password: 'password123'};

    jest.mocked(usersService.findByEmailWithPassword).mockResolvedValue(user);
    compareMock.mockImplementation(async () => true);

    await expect(service.login(dto)).resolves.toEqual({
      user: userDto,
      accessToken: 'signed-access-token',
      refreshToken: 'signed-refresh-token',
    });

    expect(compareMock).toHaveBeenCalledWith(dto.password, user.passwordHash);
    expect(jwtService.sign).toHaveBeenCalledTimes(2);
  });

  it('rejects invalid login credentials', async () => {
    const dto: LoginDto = {email: user.email, password: 'wrong-password'};

    jest.mocked(usersService.findByEmailWithPassword).mockResolvedValue(user);
    compareMock.mockImplementation(async () => false);

    await expect(service.login(dto)).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('refresh rotates both tokens when the refresh token verifies', async () => {
    jest.mocked(jwtService.verifyAsync).mockResolvedValue({sub: user.id, email: user.email, role: user.role});
    jest.mocked(usersService.findById).mockResolvedValue(user);

    await expect(service.refresh('incoming-refresh')).resolves.toEqual({
      user: userDto,
      accessToken: 'signed-access-token',
      refreshToken: 'signed-refresh-token',
    });

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('incoming-refresh', {secret: refreshSecret});
    expect(usersService.findById).toHaveBeenCalledWith(user.id);
  });

  it('refresh rejects a missing refresh token', async () => {
    await expect(service.refresh(undefined)).rejects.toThrow(UnauthorizedException);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('refresh wraps verification failures in UnauthorizedException', async () => {
    jest.mocked(jwtService.verifyAsync).mockRejectedValue(new Error('jwt expired'));

    await expect(service.refresh('expired-token')).rejects.toThrow(new UnauthorizedException('Invalid refresh token'));
  });
});
