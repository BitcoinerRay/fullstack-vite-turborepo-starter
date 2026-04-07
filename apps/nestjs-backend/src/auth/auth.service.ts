import {Injectable, UnauthorizedException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {JwtService} from '@nestjs/jwt';
import {compare, hash} from 'bcrypt';
import {type UserRole, UserDto, LoginDto, RegisterDto} from '@next-nest-turbo-auth-boilerplate/shared';
import {ConfigKey} from '../config/config-key.enum';
import {UsersService} from '../users/users.service';
import {type JwtPayload} from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{user: UserDto; accessToken: string}> {
    const saltRounds = this.configService.get<number>(ConfigKey.BCRYPT_SALT_ROUNDS, 12);
    const passwordHash = await hash(dto.password, saltRounds);
    const user = await this.usersService.create(dto.email, passwordHash);
    const userDto = this.usersService.toDto(user);
    const accessToken = this.signToken(userDto.id, userDto.email, userDto.role);

    return {user: userDto, accessToken};
  }

  async login(dto: LoginDto): Promise<{user: UserDto; accessToken: string}> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userDto = this.usersService.toDto(user);
    const accessToken = this.signToken(userDto.id, userDto.email, userDto.role);

    return {user: userDto, accessToken};
  }

  private signToken(sub: string, email: string, role: UserRole): string {
    const payload: JwtPayload = {sub, email, role};
    return this.jwtService.sign(payload);
  }
}
