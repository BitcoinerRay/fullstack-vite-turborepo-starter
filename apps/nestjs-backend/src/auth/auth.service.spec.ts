import {UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {type User} from '@next-nest-turbo-auth-boilerplate/db';
import {RegisterDto, LoginDto, UserRole} from '@next-nest-turbo-auth-boilerplate/shared';
import {compare, hash} from 'bcrypt';
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

describe('AuthService', () => {
  const usersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    toDto: jest.fn(() => userDto),
  } as unknown as UsersService;
  const jwtService = {
    sign: jest.fn(() => 'signed-token'),
  } as unknown as JwtService;

  const service = new AuthService(usersService, jwtService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hashes the password, creates a user, and signs a token during registration', async () => {
    const dto: RegisterDto = {
      email: user.email,
      password: 'password123',
    };

    hashMock.mockImplementation(async () => 'hashed-password');
    jest.mocked(usersService.create).mockResolvedValue(user);

    await expect(service.register(dto)).resolves.toEqual({
      user: userDto,
      accessToken: 'signed-token',
    });

    expect(hashMock).toHaveBeenCalledWith(dto.password, 12);
    expect(usersService.create).toHaveBeenCalledWith(dto.email, 'hashed-password');
    expect(jwtService.sign).toHaveBeenCalledWith({sub: user.id, email: user.email, role: user.role});
    expect(usersService.toDto).toHaveBeenCalledWith(user);
  });

  it('returns the dto and token for valid login credentials', async () => {
    const dto: LoginDto = {
      email: user.email,
      password: 'password123',
    };

    jest.mocked(usersService.findByEmail).mockResolvedValue(user);
    compareMock.mockImplementation(async () => true);

    await expect(service.login(dto)).resolves.toEqual({
      user: userDto,
      accessToken: 'signed-token',
    });

    expect(compareMock).toHaveBeenCalledWith(dto.password, user.passwordHash);
    expect(jwtService.sign).toHaveBeenCalledWith({sub: user.id, email: user.email, role: user.role});
    expect(usersService.toDto).toHaveBeenCalledWith(user);
  });

  it('rejects invalid login credentials', async () => {
    const dto: LoginDto = {
      email: user.email,
      password: 'wrong-password',
    };

    jest.mocked(usersService.findByEmail).mockResolvedValue(user);
    compareMock.mockImplementation(async () => false);

    await expect(service.login(dto)).rejects.toThrow(new UnauthorizedException('Invalid credentials'));

    expect(jwtService.sign).not.toHaveBeenCalled();
  });
});
