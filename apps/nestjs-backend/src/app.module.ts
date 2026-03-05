import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {APP_GUARD} from '@nestjs/core';
import {ScheduleModule} from '@nestjs/schedule';
import {ThrottlerGuard, ThrottlerModule} from '@nestjs/throttler';
import {PrismaModule} from '@next-nest-turbo-auth-boilerplate/db';
import {CommonModule} from './common/common.module';
import appConfig from './config/app.config';
import validationSchema from './config/validation.schema';
import {HealthModule} from './health/health.module';
import {RedisModule} from './redis/redis.module';
import {AuthModule} from './auth/auth.module';
import {UsersModule} from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validationSchema,
      load: [appConfig],
    }),
    ScheduleModule.forRoot(),
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
    RedisModule,
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
