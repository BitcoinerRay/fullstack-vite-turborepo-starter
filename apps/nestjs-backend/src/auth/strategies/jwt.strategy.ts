import {Injectable, UnauthorizedException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {PassportStrategy} from '@nestjs/passport';
import {ExtractJwt, Strategy} from 'passport-jwt';
import {type Request} from 'express';
import {type UserRole} from '@next-nest-turbo-auth-boilerplate/shared';
import {ConfigKey} from '../../config/config-key.enum';
import {UsersService} from '../../users/users.service';

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  // jti is only populated on refresh tokens to support server-side rotation.
  jti?: string;
};

const extractJwtFromCookie = (req: Request): string | undefined =>
  (req.cookies as Record<string, string | undefined>).access_token;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // passport-jwt expects string | null; project lint disallows null in types
        (req: Request): string | null => extractJwtFromCookie(req) ?? null, // eslint-disable-line @typescript-eslint/no-restricted-types
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>(ConfigKey.JWT_SECRET),
    });
  }

  // Re-fetch the user on every authenticated request so a deleted/disabled
  // account can't continue using a token that's still cryptographically valid.
  // findById hits the user cache (60s TTL) so cost is ~1ms when warm.
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException();
    }

    let user;
    try {
      user = await this.usersService.findById(payload.sub);
    } catch {
      throw new UnauthorizedException();
    }

    if (user.email !== payload.email || (user.role as UserRole) !== payload.role) {
      // Email or role changed since the token was issued — treat the session
      // as stale and force the client to re-auth.
      throw new UnauthorizedException();
    }

    return payload;
  }
}
