import {Injectable, NotFoundException, ConflictException} from '@nestjs/common';
import {PrismaService, type User} from '@next-nest-turbo-auth-boilerplate/db';
import {UserDto, UserRole} from '@next-nest-turbo-auth-boilerplate/shared';
import {RedisService} from '../redis/redis.service';

const safeUserSelect = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

type SafeUser = Omit<User, 'passwordHash'>;

const userCacheTtlSeconds = 60;
const userCacheKey = (id: string): string => `user:id:${id}`;

type CachedUser = {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

function serializeForCache(user: SafeUser): CachedUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function deserializeFromCache(cached: CachedUser): SafeUser {
  return {
    id: cached.id,
    email: cached.email,
    role: cached.role,
    createdAt: new Date(cached.createdAt),
    updatedAt: new Date(cached.updatedAt),
  };
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findById(id: string): Promise<SafeUser> {
    const cached = await this.redis.getJson<CachedUser>(userCacheKey(id));
    if (cached) {
      return deserializeFromCache(cached);
    }

    const user = await this.prisma.user.findUnique({where: {id}, select: safeUserSelect});

    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    await this.redis.setJson(userCacheKey(id), serializeForCache(user), userCacheTtlSeconds);
    return user;
  }

  /**
   * Returns the user record with the bare minimum needed for password
   * verification + token signing. Only the auth flow should consume this;
   * everything else must use {@link findById}.
   */
  async findByEmailWithPassword(email: string): Promise<User | undefined> {
    return (
      (await this.prisma.user.findUnique({
        where: {email},
        select: {
          id: true,
          email: true,
          role: true,
          passwordHash: true,
          createdAt: true,
          updatedAt: true,
        },
      })) ?? undefined
    );
  }

  async create(email: string, passwordHash: string): Promise<SafeUser> {
    try {
      const user = await this.prisma.user.create({
        data: {email, passwordHash, role: UserRole.USER},
        select: safeUserSelect,
      });
      await this.redis.setJson(userCacheKey(user.id), serializeForCache(user), userCacheTtlSeconds);
      return user;
    } catch (error) {
      if ((error as {code?: string}).code === 'P2002') {
        throw new ConflictException('Email already in use');
      }

      throw error;
    }
  }

  async invalidateCache(id: string): Promise<void> {
    await this.redis.del(userCacheKey(id));
  }

  toDto(user: SafeUser): UserDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
