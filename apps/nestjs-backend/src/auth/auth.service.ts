import {Injectable, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {compareSync, hashSync} from 'bcrypt';
import {UserDto, LoginDto, RegisterDto} from '@next-nest-turbo-auth-boilerplate/shared';
import {UsersService} from '../users/users.service';
import {type JwtPayload} from './strategies/jwt.strategy';

const saltRounds = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{user: UserDto; accessToken: string}> {
    const passwordHash = hashSync(dto.password, saltRounds);
    const user = await this.usersService.create(dto.email, passwordHash);
    const accessToken = this.signToken(user.id, user.email, user.role);

    return {user: this.usersService.toDto(user), accessToken};
  }

  async login(dto: LoginDto): Promise<{user: UserDto; accessToken: string}> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !compareSync(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.signToken(user.id, user.email, user.role);

    return {user: this.usersService.toDto(user), accessToken};
  }

  private signToken(sub: string, email: string, role: string): string {
    const payload: JwtPayload = {sub, email, role};
    return this.jwtService.sign(payload);
  }
}
