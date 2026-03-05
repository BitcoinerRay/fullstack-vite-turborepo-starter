# Backend (NestJS)

**Updated:** 2026-02-13

## Entry

- main.ts → AppModule, global ValidationPipe, PrismaExceptionFilter, Swagger

## Modules

| Module       | Path                    | Exports      |
| ------------ | ----------------------- | ------------ |
| AppModule    | app.module.ts           | AppModule    |
| CommonModule | common/common.module.ts | CommonModule |
| HealthModule | health/health.module.ts | HealthModule |
| RedisModule  | redis/redis.module.ts   | RedisModule  |

## Structure

```
src/
  app.module.ts
  main.ts
  config/           # app.config, validation.schema, ConfigKey
  common/
    decorators/     # ValidateHeader
    filters/        # PrismaExceptionFilter
    logger/         # LoggerMiddleware, LoggerModule, LoggerService
  health/            # HealthController, HealthModule, PrismaHealthIndicator
  redis/             # RedisModule, RedisService
  utils/             # time.util
```

## External Deps

- @nestjs/\* (common, core, config, schedule, swagger, terminus, throttler)
- @next-nest-turbo-auth-boilerplate/db
- ioredis, joi, helmet, cookie-parser, uuid

## Data

- ORM: Prisma + PostgreSQL
- Schema: packages/db/prisma/schema.prisma
- Migrations: packages/db/prisma/migrations/
