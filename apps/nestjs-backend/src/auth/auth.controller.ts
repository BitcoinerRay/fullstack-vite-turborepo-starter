import {Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UnauthorizedException} from '@nestjs/common';
import {ApiTags, ApiOperation, ApiResponse} from '@nestjs/swagger';
import {Throttle} from '@nestjs/throttler';
import {type Request, type Response} from 'express';
import {LoginDto, RegisterDto, AuthResponseDto} from '@next-nest-turbo-auth-boilerplate/shared';
import {AuthService} from './auth.service';

const accessTokenCookie = 'access_token';
const refreshTokenCookie = 'refresh_token';
const accessCookieMaxAgeMs = 15 * 60 * 1000;
const refreshCookieMaxAgeMs = 7 * 24 * 60 * 60 * 1000;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({'auth-throttler': {limit: 3, ttl: 60 * 1000}})
  @ApiOperation({summary: 'Register a new user'})
  @ApiResponse({status: 201, type: AuthResponseDto})
  @ApiResponse({status: 409, description: 'Email already in use'})
  async register(@Body() dto: RegisterDto, @Res({passthrough: true}) res: Response): Promise<AuthResponseDto> {
    const result = await this.authService.register(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return {user: result.user, accessToken: result.accessToken};
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({'auth-throttler': {limit: 5, ttl: 60 * 1000}})
  @ApiOperation({summary: 'Login with email and password'})
  @ApiResponse({status: 200, type: AuthResponseDto})
  @ApiResponse({status: 401, description: 'Invalid credentials'})
  async login(@Body() dto: LoginDto, @Res({passthrough: true}) res: Response): Promise<AuthResponseDto> {
    const result = await this.authService.login(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return {user: result.user, accessToken: result.accessToken};
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({'auth-throttler': {limit: 30, ttl: 60 * 1000}})
  @ApiOperation({summary: 'Rotate the access token using the refresh cookie'})
  @ApiResponse({status: 200, type: AuthResponseDto})
  @ApiResponse({status: 401, description: 'Invalid or expired refresh token'})
  async refresh(@Req() req: Request, @Res({passthrough: true}) res: Response): Promise<AuthResponseDto> {
    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    try {
      const result = await this.authService.refresh(cookies[refreshTokenCookie]);
      this.setAuthCookies(res, result.accessToken, result.refreshToken);
      return {user: result.user, accessToken: result.accessToken};
    } catch (error) {
      this.clearAuthCookies(res);
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({summary: 'Logout and clear session cookies'})
  @ApiResponse({status: 204, description: 'Logged out successfully'})
  async logout(@Req() req: Request, @Res({passthrough: true}) res: Response): Promise<void> {
    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    // Revoke the jti so a leaked refresh cookie can't be replayed after logout.
    await this.authService.revoke(cookies[refreshTokenCookie]);
    this.clearAuthCookies(res);
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie(accessTokenCookie, accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: accessCookieMaxAgeMs,
    });
    res.cookie(refreshTokenCookie, refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: refreshCookieMaxAgeMs,
      path: '/api/v1/auth',
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie(accessTokenCookie);
    res.clearCookie(refreshTokenCookie, {path: '/api/v1/auth'});
  }
}
