import {IsEmail, IsString, Matches, MinLength, MaxLength} from 'class-validator';
import {ApiProperty} from '@nestjs/swagger';

// Mirror this regex on the frontend zod schema (apps/vite-frontend/src/pages/
// auth/RegisterPage.tsx). At least one letter + one digit, 8-64 chars. Symbols
// allowed but not required, to avoid blocking long passphrases.
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/u;

export class RegisterDto {
  @ApiProperty({example: 'user@example.com'})
  @IsEmail()
  email!: string;

  @ApiProperty({example: 'Passw0rd!', minLength: 8, maxLength: 64})
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(passwordPattern, {message: 'Password must contain letters and digits.'})
  password!: string;
}
