import {type ExecutionContext, type INestApplication, UnauthorizedException} from '@nestjs/common';
import {Test, type TestingModule} from '@nestjs/testing';
import {type User} from '@next-nest-turbo-auth-boilerplate/db';
import {UserRole} from '@next-nest-turbo-auth-boilerplate/shared';
import * as cookieParser from 'cookie-parser';
import {type Request} from 'express';
import {AuthController} from '../src/auth/auth.controller';
import {AuthService} from '../src/auth/auth.service';
import {JwtAuthGuard} from '../src/auth/guards/jwt-auth.guard';
import {type JwtPayload} from '../src/auth/strategies/jwt.strategy';
import {UsersController} from '../src/users/users.controller';
import {UsersService} from '../src/users/users.service';

const user: User = {
  id: 'user-1',
  email: 'user@example.com',
  passwordHash: 'stored-password-hash',
  role: UserRole.USER,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const userDto = {
  id: user.id,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
};

const authPayload: JwtPayload = {
  sub: user.id,
  email: user.email,
  role: user.role as UserRole,
};

type AuthServiceResult = {user: typeof userDto; accessToken: string; refreshToken: string};

describe('Auth flows (e2e)', () => {
  let app: INestApplication;
  let jwtGuardSpy: jest.SpiedFunction<JwtAuthGuard['canActivate']>;

  beforeAll(async () => {
    jwtGuardSpy = jest.spyOn(JwtAuthGuard.prototype, 'canActivate').mockImplementation((context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest<Request & {user?: JwtPayload}>();

      if (request.headers.authorization === 'Bearer valid-token') {
        request.user = authPayload;
        return true;
      }

      throw new UnauthorizedException();
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController, UsersController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            async register(): Promise<AuthServiceResult> {
              return {user: userDto, accessToken: 'registered-token', refreshToken: 'registered-refresh'};
            },
            async login(dto: {email: string}): Promise<AuthServiceResult> {
              if (dto.email === 'invalid@example.com') {
                throw new UnauthorizedException('Invalid credentials');
              }

              return {user: userDto, accessToken: 'valid-token', refreshToken: 'valid-refresh'};
            },
            async refresh(refreshToken: string | undefined): Promise<AuthServiceResult> {
              if (refreshToken !== 'valid-refresh') {
                throw new UnauthorizedException('Invalid refresh token');
              }

              return {user: userDto, accessToken: 'rotated-token', refreshToken: 'rotated-refresh'};
            },
          },
        },
        {
          provide: UsersService,
          useValue: {
            async findById(): Promise<User> {
              return user;
            },
            toDto(): typeof userDto {
              return userDto;
            },
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1');
    await app.listen(0, '127.0.0.1');
  });

  afterAll(async () => {
    await app.close();
    jwtGuardSpy.mockRestore();
  });

  it('registers through the HTTP endpoint and sets both auth cookies', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/register`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({email: user.email, password: 'password123'}),
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      user: userDto,
      accessToken: 'registered-token',
    });
    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('access_token=registered-token');
    expect(setCookie).toContain('refresh_token=registered-refresh');
    expect(setCookie).toContain('Path=/api/v1/auth');
  });

  it('logs in through the HTTP endpoint and sets both auth cookies', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/login`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({email: user.email, password: 'password123'}),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      user: userDto,
      accessToken: 'valid-token',
    });
    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('access_token=valid-token');
    expect(setCookie).toContain('refresh_token=valid-refresh');
  });

  it('returns unauthorized for invalid login credentials', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/login`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({email: 'invalid@example.com', password: 'password123'}),
    });

    expect(response.status).toBe(401);
  });

  it('rotates both cookies when the refresh endpoint is called with a valid cookie', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {cookie: 'refresh_token=valid-refresh'},
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      user: userDto,
      accessToken: 'rotated-token',
    });
    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('access_token=rotated-token');
    expect(setCookie).toContain('refresh_token=rotated-refresh');
  });

  it('clears both cookies and returns 401 when the refresh cookie is invalid', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {cookie: 'refresh_token=bogus'},
    });

    expect(response.status).toBe(401);
    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('access_token=;');
    expect(setCookie).toContain('refresh_token=;');
  });

  it('clears both auth cookies on logout', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/logout`, {
      method: 'POST',
    });

    expect(response.status).toBe(204);
    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('access_token=;');
    expect(setCookie).toContain('refresh_token=;');
  });

  it('returns the current authenticated user over HTTP when the auth header is valid', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/users/me`, {
      headers: {
        authorization: 'Bearer valid-token',
      },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(userDto);
  });

  it('returns unauthorized for users/me without a valid auth header', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/users/me`);

    expect(response.status).toBe(401);
  });
});
