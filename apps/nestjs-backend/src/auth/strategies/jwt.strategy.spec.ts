import {NotFoundException, UnauthorizedException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {UserRole} from '@next-nest-turbo-auth-boilerplate/shared';
import {ConfigKey} from '../../config/config-key.enum';
import {UsersService} from '../../users/users.service';
import {JwtStrategy, type JwtPayload} from './jwt.strategy';

const validPayload: JwtPayload = {
  sub: 'user-1',
  email: 'user@example.com',
  role: UserRole.USER,
};

const persistedUser = {
  id: 'user-1',
  email: 'user@example.com',
  role: UserRole.USER,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('JwtStrategy.validate', () => {
  const usersService = {
    findById: jest.fn(),
  } as unknown as UsersService;

  const configService = {
    getOrThrow: jest.fn((key: ConfigKey) => {
      if (key === ConfigKey.JWT_SECRET) return 'a'.repeat(32);
      throw new Error(`unexpected key ${key}`);
    }),
  } as unknown as ConfigService;

  const strategy = new JwtStrategy(configService, usersService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the payload when the user still exists with matching email and role', async () => {
    jest.mocked(usersService.findById).mockResolvedValue(persistedUser);

    await expect(strategy.validate(validPayload)).resolves.toEqual(validPayload);
    expect(usersService.findById).toHaveBeenCalledWith(validPayload.sub);
  });

  it('rejects payloads missing sub or email', async () => {
    await expect(strategy.validate({...validPayload, sub: ''})).rejects.toThrow(UnauthorizedException);
    await expect(strategy.validate({...validPayload, email: ''})).rejects.toThrow(UnauthorizedException);
    expect(usersService.findById).not.toHaveBeenCalled();
  });

  it('rejects when the user has been deleted since the token was issued', async () => {
    jest.mocked(usersService.findById).mockRejectedValue(new NotFoundException('User not found'));

    await expect(strategy.validate(validPayload)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects when the persisted email no longer matches the token', async () => {
    jest.mocked(usersService.findById).mockResolvedValue({...persistedUser, email: 'rotated@example.com'});

    await expect(strategy.validate(validPayload)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects when the persisted role no longer matches the token', async () => {
    jest.mocked(usersService.findById).mockResolvedValue({...persistedUser, role: UserRole.ADMIN});

    await expect(strategy.validate(validPayload)).rejects.toThrow(UnauthorizedException);
  });
});
