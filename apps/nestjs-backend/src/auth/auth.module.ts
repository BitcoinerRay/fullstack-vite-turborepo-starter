import {Module} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {JwtModule, type JwtModuleOptions} from '@nestjs/jwt';
import {PassportModule} from '@nestjs/passport';
import {ConfigKey} from '../config/config-key.enum';
import {UsersModule} from '../users/users.module';
import {AuthController} from './auth.controller';
import {AuthService} from './auth.service';
import {JwtStrategy} from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory(configService: ConfigService): JwtModuleOptions {
        return {
          secret: configService.getOrThrow<string>(ConfigKey.JWT_SECRET),
          signOptions: {expiresIn: configService.get(ConfigKey.JWT_EXPIRES_IN) ?? ('7d' as const)},
        };
      },
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
