import {ApiProperty} from '@nestjs/swagger';
import {UserDto} from '../user/user.dto';

export class AuthResponseDto {
  @ApiProperty({type: () => UserDto})
  user!: UserDto;

  @ApiProperty({example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'})
  accessToken!: string;
}
