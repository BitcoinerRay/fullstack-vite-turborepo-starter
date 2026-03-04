import {Body, Controller, HttpCode, HttpStatus, Post, Res} from '@nestjs/common';
import {ApiTags, ApiOperation, ApiResponse} from '@nestjs/swagger';
import {type Response} from 'express';
import {LoginDto, RegisterDto, AuthResponseDto} from '@next-nest-turbo-auth-boilerplate/shared';
import {AuthService} from './auth.service';

const accessTokenCookie = 'access_token';
const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({summary: 'Register a new user'})
  @ApiResponse({status: 201, type: AuthResponseDto})
  @ApiResponse({status: 409, description: 'Email already in use'})
  async register(@Body() dto: RegisterDto, @Res({passthrough: true}) res: Response): Promise<AuthResponseDto> {
    const result = await this.authService.register(dto);
    this.setTokenCookie(res, result.accessToken);
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({summary: 'Login with email and password'})
  @ApiResponse({status: 200, type: AuthResponseDto})
  @ApiResponse({status: 401, description: 'Invalid credentials'})
  async login(@Body() dto: LoginDto, @Res({passthrough: true}) res: Response): Promise<AuthResponseDto> {
    const result = await this.authService.login(dto);
    this.setTokenCookie(res, result.accessToken);
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({summary: 'Logout and clear session cookie'})
  @ApiResponse({status: 204, description: 'Logged out successfully'})
  logout(@Res({passthrough: true}) res: Response): void {
    res.clearCookie(accessTokenCookie);
  }

  private setTokenCookie(res: Response, token: string): void {
    res.cookie(accessTokenCookie, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: sevenDaysMs,
    });
  }
}
