import {type Response} from 'express';
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
};

describe('AuthController', () => {
  const authService = {
    register: jest.fn(async () => authResponse),
    login: jest.fn(async () => authResponse),
  } as unknown as AuthService;

  const controller = new AuthController(authService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets the auth cookie when registration succeeds', async () => {
    const dto: RegisterDto = {
      email: authResponse.user.email,
      password: 'password123',
    };
    const response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    } as unknown as Response;

    await expect(controller.register(dto, response)).resolves.toEqual(authResponse);

    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(response.cookie).toHaveBeenCalledWith(
      'access_token',
      authResponse.accessToken,
      expect.objectContaining({
        httpOnly: true,
        maxAge: 604_800_000,
        sameSite: 'strict',
      }),
    );
  });

  it('sets the auth cookie when login succeeds', async () => {
    const dto: LoginDto = {
      email: authResponse.user.email,
      password: 'password123',
    };
    const response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    } as unknown as Response;

    await expect(controller.login(dto, response)).resolves.toEqual(authResponse);

    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(response.cookie).toHaveBeenCalledWith(
      'access_token',
      authResponse.accessToken,
      expect.objectContaining({
        httpOnly: true,
        maxAge: 604_800_000,
        sameSite: 'strict',
      }),
    );
  });

  it('clears the auth cookie on logout', () => {
    const response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    } as unknown as Response;

    controller.logout(response);

    expect(response.clearCookie).toHaveBeenCalledWith('access_token');
  });
});
