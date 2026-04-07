import {Injectable, UnauthorizedException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {JwtService} from '@nestjs/jwt';
import {compare, hash} from 'bcrypt';
import {type UserRole, UserDto, LoginDto, RegisterDto} from '@next-nest-turbo-auth-boilerplate/shared';
import {ConfigKey} from '../config/config-key.enum';
import {UsersService} from '../users/users.service';
import {type JwtPayload} from './strategies/jwt.strategy';

export type AuthTokens = {accessToken: string; refreshToken: string};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{user: UserDto} & AuthTokens> {
    const saltRounds = this.configService.get<number>(ConfigKey.BCRYPT_SALT_ROUNDS, 12);
    const passwordHash = await hash(dto.password, saltRounds);
    const user = await this.usersService.create(dto.email, passwordHash);
    const userDto = this.usersService.toDto(user);
    const tokens = this.issueTokens(userDto);

    return {user: userDto, ...tokens};
  }

  async login(dto: LoginDto): Promise<{user: UserDto} & AuthTokens> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userDto = this.usersService.toDto(user);
    const tokens = this.issueTokens(userDto);

    return {user: userDto, ...tokens};
  }

  /**
   * Verify a refresh token and rotate it together with a fresh access token.
   * Throws UnauthorizedException on any validation failure (expired, bad
   * signature, missing user) so the controller can clear cookies cleanly.
   */
  async refresh(refreshToken: string | undefined): Promise<{user: UserDto} & AuthTokens> {
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>(ConfigKey.REFRESH_TOKEN_SECRET),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    const userDto = this.usersService.toDto(user);
    const tokens = this.issueTokens(userDto);

    return {user: userDto, ...tokens};
  }

  private issueTokens(user: Pick<UserDto, 'id' | 'email' | 'role'>): AuthTokens {
    return {
      accessToken: this.signAccessToken(user.id, user.email, user.role),
      refreshToken: this.signRefreshToken(user.id, user.email, user.role),
    };
  }

  private signAccessToken(sub: string, email: string, role: UserRole): string {
    const payload: JwtPayload = {sub, email, role};
    return this.jwtService.sign(payload);
  }

  private signRefreshToken(sub: string, email: string, role: UserRole): string {
    const payload: JwtPayload = {sub, email, role};
    const expiresIn = this.configService.get<string>(ConfigKey.REFRESH_TOKEN_EXPIRES_IN, '7d');
    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>(ConfigKey.REFRESH_TOKEN_SECRET),
      // ms-style strings like '7d' are valid at runtime but not in @nestjs/jwt's narrow type.
      expiresIn: expiresIn as unknown as number,
    });
  }
}
