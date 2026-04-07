import {Injectable, UnauthorizedException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {PassportStrategy} from '@nestjs/passport';
import {ExtractJwt, Strategy} from 'passport-jwt';
import {type Request} from 'express';
import {type UserRole} from '@next-nest-turbo-auth-boilerplate/shared';
import {ConfigKey} from '../../config/config-key.enum';

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

const extractJwtFromCookie = (req: Request): string | undefined =>
  (req.cookies as Record<string, string | undefined>).access_token;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
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

  validate(payload: JwtPayload): JwtPayload {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException();
    }

    return payload;
  }
}
