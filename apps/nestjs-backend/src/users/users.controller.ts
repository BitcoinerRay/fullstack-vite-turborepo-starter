import {Controller, Get, UseGuards} from '@nestjs/common';
import {ApiTags, ApiOperation, ApiResponse, ApiBearerAuth} from '@nestjs/swagger';
import {UserDto} from '@next-nest-turbo-auth-boilerplate/shared';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {type JwtPayload} from '../auth/strategies/jwt.strategy';
import {UsersService} from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({summary: 'Get current authenticated user'})
  @ApiResponse({status: 200, type: UserDto})
  @ApiResponse({status: 401, description: 'Unauthorized'})
  async getMe(@CurrentUser() payload: JwtPayload): Promise<UserDto> {
    const user = await this.usersService.findById(payload.sub);
    return this.usersService.toDto(user);
  }
}
