import {ConflictException, NotFoundException} from '@nestjs/common';
import {type PrismaService, type User} from '@next-nest-turbo-auth-boilerplate/db';
import {UserRole} from '@next-nest-turbo-auth-boilerplate/shared';
import {type RedisService} from '../redis/redis.service';
import {UsersService} from './users.service';

const user: User = {
  id: 'user-1',
  email: 'user@example.com',
  passwordHash: 'stored-password-hash',
  role: UserRole.USER,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const safeUser = {
  id: user.id,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
};

describe('UsersService', () => {
  const prismaUser = {
    findUnique: jest.fn(),
    create: jest.fn(),
  };
  const prisma = {user: prismaUser} as unknown as PrismaService;
  const redis = {
    getJson: jest.fn(),
    setJson: jest.fn(),
    del: jest.fn(),
  } as unknown as RedisService;

  const service = new UsersService(prisma, redis);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the cached user when redis hits, skipping prisma', async () => {
    jest.mocked(redis.getJson).mockResolvedValue({
      id: user.id,
      email: user.email,
      role: UserRole.USER,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });

    await expect(service.findById(user.id)).resolves.toEqual(safeUser);
    expect(prismaUser.findUnique).not.toHaveBeenCalled();
    expect(redis.setJson).not.toHaveBeenCalled();
  });

  it('falls back to prisma on a cache miss and writes the result back', async () => {
    jest.mocked(redis.getJson).mockResolvedValue(undefined);
    prismaUser.findUnique.mockResolvedValue(safeUser);

    await expect(service.findById(user.id)).resolves.toEqual(safeUser);

    expect(prismaUser.findUnique).toHaveBeenCalledWith({
      where: {id: user.id},
      select: {id: true, email: true, role: true, createdAt: true, updatedAt: true},
    });
    expect(redis.setJson).toHaveBeenCalledWith(
      `user:id:${user.id}`,
      expect.objectContaining({id: user.id, email: user.email}),
      60,
    );
  });

  it('throws NotFoundException when neither cache nor db has the user', async () => {
    jest.mocked(redis.getJson).mockResolvedValue(undefined);
    prismaUser.findUnique.mockResolvedValue(null);

    await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    expect(redis.setJson).not.toHaveBeenCalled();
  });

  it('warms the cache after creating a new user', async () => {
    prismaUser.create.mockResolvedValue(safeUser);

    await expect(service.create(user.email, 'hashed')).resolves.toEqual(safeUser);
    expect(redis.setJson).toHaveBeenCalledWith(
      `user:id:${user.id}`,
      expect.objectContaining({id: user.id}),
      60,
    );
  });

  it('translates Prisma P2002 collisions into ConflictException', async () => {
    prismaUser.create.mockRejectedValue(Object.assign(new Error('unique violation'), {code: 'P2002'}));

    await expect(service.create(user.email, 'hashed')).rejects.toThrow(ConflictException);
    expect(redis.setJson).not.toHaveBeenCalled();
  });

  it('invalidateCache deletes the user cache key', async () => {
    await service.invalidateCache(user.id);
    expect(redis.del).toHaveBeenCalledWith(`user:id:${user.id}`);
  });
});
