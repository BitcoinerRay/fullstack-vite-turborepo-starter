import {type INestApplication} from '@nestjs/common';
import {type HealthCheckResult, type HealthIndicatorResult, HealthCheckService} from '@nestjs/terminus';
import {Test, type TestingModule} from '@nestjs/testing';
import {HealthController} from '../src/health/health.controller';
import {PrismaHealthIndicator} from '../src/health/prisma.health';
import {RedisHealthIndicator} from '../src/health/redis.health';

function mergeHealthResults(results: HealthIndicatorResult[]): HealthIndicatorResult {
  const details: HealthIndicatorResult = {};

  for (const result of results) {
    Object.assign(details, result);
  }

  return details;
}

describe('HealthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            async check(checks: Array<() => Promise<HealthIndicatorResult>>): Promise<HealthCheckResult> {
              const results = await Promise.all(checks.map(async (check) => check()));
              const details = mergeHealthResults(results);

              return {
                status: 'ok',
                info: details,
                error: {},
                details,
              };
            },
          },
        },
        {
          provide: PrismaHealthIndicator,
          useValue: {
            pingCheck: async (): Promise<HealthIndicatorResult> => ({
              database: {
                status: 'up',
              },
            }),
          },
        },
        {
          provide: RedisHealthIndicator,
          useValue: {
            pingCheck: async (): Promise<HealthIndicatorResult> => ({
              redis: {
                status: 'up',
              },
            }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.listen(0, '127.0.0.1');
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns a combined health payload from the HTTP endpoint', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/health`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
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
  });
});
