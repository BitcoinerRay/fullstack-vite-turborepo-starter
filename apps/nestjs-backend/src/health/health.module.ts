import {Module} from '@nestjs/common';
import {TerminusModule} from '@nestjs/terminus';
import {RedisModule} from '../redis/redis.module';
import {HealthController} from './health.controller';
import {PrismaHealthIndicator} from './prisma.health';
import {RedisHealthIndicator} from './redis.health';

@Module({
  imports: [TerminusModule, RedisModule],
  controllers: [HealthController],
  providers: [PrismaHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
