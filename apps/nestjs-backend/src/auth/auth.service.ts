import {randomUUID} from 'node:crypto';
import {Injectable, UnauthorizedException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {JwtService} from '@nestjs/jwt';
import {compare, hash} from 'bcrypt';
import {type UserRole, UserDto, LoginDto, RegisterDto} from '@next-nest-turbo-auth-boilerplate/shared';
import {ConfigKey} from '../config/config-key.enum';
import {RedisService} from '../redis/redis.service';
import {UsersService} from '../users/users.service';
import {type JwtPayload} from './strategies/jwt.strategy';

export type AuthTokens = {accessToken: string; refreshToken: string};

const refreshKey = (jti: string): string => `refresh:jti:${jti}`;

const secondsPerUnit: Record<string, number> = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 24 * 60 * 60,
};

const fallbackRefreshTtlSeconds = 7 * 24 * 60 * 60;

// Minimal parser for the ms-style strings used by @nestjs/jwt expiresIn (e.g.
// '7d', '15m', '3600'). Defaults to 7 days if the input is missing or weird.
export function parseRefreshTtlSeconds(value: string | number | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }

  if (typeof value !== 'string') {
    return fallbackRefreshTtlSeconds;
  }

  const match = /^(\d+)\s*([smhd]?)$/u.exec(value.trim());
  if (!match) {
    return fallbackRefreshTtlSeconds;
  }

  const amount = Number.parseInt(match[1] ?? '', 10);
  const unit = match[2] ?? 's';
  const multiplier = secondsPerUnit[unit] ?? 1;
  return amount * multiplier;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async register(dto: RegisterDto): Promise<{user: UserDto} & AuthTokens> {
    const saltRounds = this.configService.get<number>(ConfigKey.BCRYPT_SALT_ROUNDS, 12);
    const passwordHash = await hash(dto.password, saltRounds);
    const user = await this.usersService.create(dto.email, passwordHash);
    const userDto = this.usersService.toDto(user);
    const tokens = await this.issueTokens(userDto);

    return {user: userDto, ...tokens};
  }

  async login(dto: LoginDto): Promise<{user: UserDto} & AuthTokens> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userDto = this.usersService.toDto(user);
    const tokens = await this.issueTokens(userDto);

    return {user: userDto, ...tokens};
  }

  /**
   * Verify a refresh token and rotate it. The token's jti must still exist in
   * Redis — we delete it atomically as part of the lookup so the same token
   * cannot be redeemed twice. Throws UnauthorizedException on any failure so
   * the controller can clear cookies cleanly.
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

    if (!payload.jti) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const consumed = await this.redis.consumeKey(refreshKey(payload.jti));
    if (!consumed) {
      // Either the jti expired/was revoked, or this is a replay of a token
      // we already rotated. Both cases mean: do not extend the session.
      throw new UnauthorizedException('Refresh token already used');
    }

    const user = await this.usersService.findById(payload.sub);
    const userDto = this.usersService.toDto(user);
    const tokens = await this.issueTokens(userDto);

    return {user: userDto, ...tokens};
  }

  /**
   * Best-effort revoke called from logout. Verifies and consumes the jti so a
   * leaked refresh token can't be replayed after the user has signed out. We
   * silently ignore invalid/expired tokens — there is nothing to revoke.
   */
  async revoke(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>(ConfigKey.REFRESH_TOKEN_SECRET),
      });
      if (payload.jti) {
        await this.redis.consumeKey(refreshKey(payload.jti));
      }
    } catch {
      // Invalid or expired tokens carry nothing worth revoking.
    }
  }

  private async issueTokens(user: Pick<UserDto, 'id' | 'email' | 'role'>): Promise<AuthTokens> {
    const jti = randomUUID();
    const accessToken = this.signAccessToken(user.id, user.email, user.role);
    const refreshToken = this.signRefreshToken(user.id, user.email, user.role, jti);
    const ttl = parseRefreshTtlSeconds(this.configService.get<string>(ConfigKey.REFRESH_TOKEN_EXPIRES_IN, '7d'));
    await this.redis.recordKey(refreshKey(jti), ttl);
    return {accessToken, refreshToken};
  }

  private signAccessToken(sub: string, email: string, role: UserRole): string {
    const payload: JwtPayload = {sub, email, role};
    return this.jwtService.sign(payload);
  }

  private signRefreshToken(sub: string, email: string, role: UserRole, jti: string): string {
    const payload: JwtPayload = {sub, email, role, jti};
    const expiresIn = this.configService.get<string>(ConfigKey.REFRESH_TOKEN_EXPIRES_IN, '7d');
    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>(ConfigKey.REFRESH_TOKEN_SECRET),
      // ms-style strings like '7d' are valid at runtime but not in @nestjs/jwt's narrow type.
      expiresIn: expiresIn as unknown as number,
    });
  }
}
