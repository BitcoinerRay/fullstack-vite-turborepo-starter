import {createParamDecorator, type ExecutionContext} from '@nestjs/common';
import {type Request} from 'express';
import {type JwtPayload} from '../strategies/jwt.strategy';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): JwtPayload => {
  const request = ctx.switchToHttp().getRequest<Request & {user: JwtPayload}>();
  return request.user;
});
