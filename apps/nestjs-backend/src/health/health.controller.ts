import {Controller, Get} from '@nestjs/common';
import {ApiTags, ApiOperation, ApiResponse} from '@nestjs/swagger';
import {HealthCheckService, HealthCheck, HealthIndicatorResult, HealthCheckResult} from '@nestjs/terminus';
import {PrismaHealthIndicator} from './prisma.health';
import {RedisHealthIndicator} from './redis.health';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: PrismaHealthIndicator,
    private readonly redis: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({summary: 'Check application health status'})
  @ApiResponse({
    status: 200,
    description: 'Health check successful',
  })
  @ApiResponse({
    status: 503,
    description: 'Service Unavailable',
  })
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => this.db.pingCheck('database'),
      async (): Promise<HealthIndicatorResult> => this.redis.pingCheck('redis'),
    ]);
  }
}
