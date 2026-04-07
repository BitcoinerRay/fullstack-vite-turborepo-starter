import {UnauthorizedException} from '@nestjs/common';
import {type Request, type Response} from 'express';
import {RegisterDto, LoginDto, UserRole} from '@next-nest-turbo-auth-boilerplate/shared';
import {AuthService} from './auth.service';
import {AuthController} from './auth.controller';

const authResponse = {
  user: {
    id: 'user-1',
    email: 'user@example.com',
    role: UserRole.USER,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  accessToken: 'signed-token',
  refreshToken: 'signed-refresh-token',
};

function buildResponse(): Response {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;
}

const refreshCookieName = 'refresh_token';

function buildRequest(refreshToken: string): Request {
  const cookies: Record<string, string> = {};
  cookies[refreshCookieName] = refreshToken;
  return {cookies} as unknown as Request;
}

describe('AuthController', () => {
  const authService = {
    register: jest.fn(async () => authResponse),
    login: jest.fn(async () => authResponse),
    refresh: jest.fn(async () => authResponse),
  } as unknown as AuthService;

  const controller = new AuthController(authService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets access and refresh cookies when registration succeeds', async () => {
    const dto: RegisterDto = {email: authResponse.user.email, password: 'password123'};
    const response = buildResponse();

    await expect(controller.register(dto, response)).resolves.toEqual({
      user: authResponse.user,
      accessToken: authResponse.accessToken,
    });

    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(response.cookie).toHaveBeenCalledWith(
      'access_token',
      authResponse.accessToken,
      expect.objectContaining({httpOnly: true, sameSite: 'strict', maxAge: 15 * 60 * 1000}),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'refresh_token',
      authResponse.refreshToken,
      expect.objectContaining({httpOnly: true, sameSite: 'strict', path: '/api/v1/auth'}),
    );
  });

  it('sets access and refresh cookies when login succeeds', async () => {
    const dto: LoginDto = {email: authResponse.user.email, password: 'password123'};
    const response = buildResponse();

    await expect(controller.login(dto, response)).resolves.toEqual({
      user: authResponse.user,
      accessToken: authResponse.accessToken,
    });

    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(response.cookie).toHaveBeenCalledTimes(2);
  });

  it('refreshes tokens from the refresh cookie and rotates both cookies', async () => {
    const request = buildRequest('incoming-refresh');
    const response = buildResponse();

    await expect(controller.refresh(request, response)).resolves.toEqual({
      user: authResponse.user,
      accessToken: authResponse.accessToken,
    });

    expect(authService.refresh).toHaveBeenCalledWith('incoming-refresh');
    expect(response.cookie).toHaveBeenCalledTimes(2);
  });

  it('clears both auth cookies and rethrows when refresh fails', async () => {
    jest.mocked(authService.refresh).mockRejectedValueOnce(new UnauthorizedException('Invalid refresh token'));
    const request = buildRequest('bad-refresh');
    const response = buildResponse();

    await expect(controller.refresh(request, response)).rejects.toThrow(UnauthorizedException);

    expect(response.clearCookie).toHaveBeenCalledWith('access_token');
    expect(response.clearCookie).toHaveBeenCalledWith('refresh_token', {path: '/api/v1/auth'});
  });

  it('clears both auth cookies on logout', () => {
    const response = buildResponse();

    controller.logout(response);

    expect(response.clearCookie).toHaveBeenCalledWith('access_token');
    expect(response.clearCookie).toHaveBeenCalledWith('refresh_token', {path: '/api/v1/auth'});
  });
});
