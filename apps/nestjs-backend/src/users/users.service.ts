import {Injectable, NotFoundException, ConflictException} from '@nestjs/common';
import {PrismaService, type User} from '@next-nest-turbo-auth-boilerplate/db';
import {UserDto, UserRole} from '@next-nest-turbo-auth-boilerplate/shared';

const safeUserSelect = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({where: {id}, select: safeUserSelect});

    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    return user;
  }

  /**
   * Returns the full user record including `passwordHash`.
   * Only the auth flow should consume this; everything else must use {@link findById}.
   */
  async findByEmailWithPassword(email: string): Promise<User | undefined> {
    return (await this.prisma.user.findUnique({where: {email}})) ?? undefined;
  }

  async create(email: string, passwordHash: string): Promise<SafeUser> {
    try {
      return await this.prisma.user.create({
        data: {email, passwordHash, role: UserRole.USER},
        select: safeUserSelect,
      });
    } catch (error) {
      if ((error as {code?: string}).code === 'P2002') {
        throw new ConflictException('Email already in use');
      }

      throw error;
    }
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
