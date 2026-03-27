import {Injectable} from '@nestjs/common';
import {type HealthIndicatorResult, HealthIndicatorService} from '@nestjs/terminus';
import {RedisService} from '../redis/redis.service';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly redis: RedisService,
    private readonly indicator: HealthIndicatorService,
  ) {}

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.redis.ping();
      return this.indicator.check(key).up();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return this.indicator.check(key).down({message});
    }
  }
}
