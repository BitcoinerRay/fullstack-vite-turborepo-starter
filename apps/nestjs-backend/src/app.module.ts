import {resolve} from 'node:path';
import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {APP_GUARD} from '@nestjs/core';
import {ThrottlerGuard, ThrottlerModule} from '@nestjs/throttler';
import {PrismaModule} from '@next-nest-turbo-auth-boilerplate/db';
import {CommonModule} from './common/common.module';
import appConfig from './config/app.config';
import validationSchema from './config/validation.schema';
import {HealthModule} from './health/health.module';
import {AuthModule} from './auth/auth.module';
import {UsersModule} from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(process.cwd(), `../../.env.${process.env.NODE_ENV ?? 'development'}`),
        resolve(process.cwd(), '../../.env'),
      ],
      validationSchema,
      load: [appConfig],
    }),
    PrismaModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default-throttler',
          ttl: 60 * 1000,
          limit: 60,
        },
      ],
    }),
    CommonModule,
    HealthModule,
    AuthModule,
    UsersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
