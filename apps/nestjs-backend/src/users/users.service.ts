import {Injectable, NotFoundException, ConflictException} from '@nestjs/common';
import {PrismaService, type User} from '@next-nest-turbo-auth-boilerplate/db';
import {UserDto, UserRole} from '@next-nest-turbo-auth-boilerplate/shared';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({where: {id}});

    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return (await this.prisma.user.findUnique({where: {email}})) ?? undefined;
  }

  async create(email: string, passwordHash: string): Promise<User> {
    const existing = await this.prisma.user.findUnique({where: {email}});

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    return this.prisma.user.create({
      data: {email, passwordHash, role: UserRole.USER},
    });
  }

  toDto(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
