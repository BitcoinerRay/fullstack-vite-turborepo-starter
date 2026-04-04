import {type HealthCheckResult, type HealthIndicatorResult, HealthCheckService} from '@nestjs/terminus';
import {HealthController} from './health.controller';
import {PrismaHealthIndicator} from './prisma.health';
import {RedisHealthIndicator} from './redis.health';

function mergeHealthResults(results: HealthIndicatorResult[]): HealthIndicatorResult {
  const details: HealthIndicatorResult = {};

  for (const result of results) {
    Object.assign(details, result);
  }

  return details;
}

describe('HealthController', () => {
  it('combines database and redis checks through the terminus service', async () => {
    const db = {
      pingCheck: jest.fn(
        async (): Promise<HealthIndicatorResult> => ({
          database: {
            status: 'up',
          },
        }),
      ),
    } as unknown as PrismaHealthIndicator;

    const redis = {
      pingCheck: jest.fn(
        async (): Promise<HealthIndicatorResult> => ({
          redis: {
            status: 'up',
          },
        }),
      ),
    } as unknown as RedisHealthIndicator;

    const health = {
      check: jest.fn(async (checks: Array<() => Promise<HealthIndicatorResult>>): Promise<HealthCheckResult> => {
        const results = await Promise.all(checks.map(async (check) => check()));
        const details = mergeHealthResults(results);

        return {
          status: 'ok',
          info: details,
          error: {},
          details,
        };
      }),
    } as unknown as HealthCheckService;

    const controller = new HealthController(health, db, redis);

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      info: {
        database: {
          status: 'up',
        },
        redis: {
          status: 'up',
        },
      },
      error: {},
      details: {
        database: {
          status: 'up',
        },
        redis: {
          status: 'up',
        },
      },
    });

    expect(health.check).toHaveBeenCalledTimes(1);
    expect(db.pingCheck).toHaveBeenCalledWith('database');
    expect(redis.pingCheck).toHaveBeenCalledWith('redis');
  });
});
