import {IsEmail, IsString, MinLength, MaxLength} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({example: 'user@example.com'})
  @IsEmail()
  email!: string;

  @ApiProperty({example: 'password123', minLength: 8, maxLength: 64})
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password!: string;
}
