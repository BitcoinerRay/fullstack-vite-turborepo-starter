import {IsEmail, IsOptional, IsString, MaxLength, MinLength} from 'class-validator';
import {ApiPropertyOptional} from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({example: 'new@example.com'})
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({example: 'newpassword123', minLength: 8, maxLength: 64})
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password?: string;
}
