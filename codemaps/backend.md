# Backend (NestJS)

**Updated:** 2026-04-04

## Entry

- 启动文件：`src/main.ts`
- 根模块：`src/app.module.ts`
- 全局能力：
  - `helmet`
  - `compression`
  - `cookie-parser`
  - `ValidationPipe`
  - `HttpExceptionFilter`
  - `PrismaExceptionFilter`
  - 全局前缀 `/api/v1`
  - 可选 Swagger `/api/docs`

## Module Breakdown

| 模块           | 位置                | 当前职责                            |
| -------------- | ------------------- | ----------------------------------- |
| `AppModule`    | `src/app.module.ts` | 汇总配置、Prisma、限流、业务模块    |
| `AuthModule`   | `src/auth/`         | 登录、注册、JWT 签发与校验          |
| `UsersModule`  | `src/users/`        | 当前用户查询与 DTO 转换             |
| `HealthModule` | `src/health/`       | 健康检查与数据库连通性              |
| `CommonModule` | `src/common/`       | 全局 logger、中间件、过滤器、装饰器 |
| `RedisModule`  | `src/redis/`        | Redis 连接、发布/订阅能力           |

## Source Layout

```text
src/
  app.module.ts
  main.ts
  auth/
    auth.controller.ts
    auth.module.ts
    auth.service.ts
    decorators/
    guards/
    strategies/
  common/
    decorators/
    filters/
    logger/
  config/
    app.config.ts
    config-key.enum.ts
    readme.md
    validation.schema.ts
  health/
    health.controller.ts
    health.module.ts
    prisma.health.ts
  redis/
    redis.module.ts
    redis.service.ts
  users/
    users.controller.ts
    users.module.ts
    users.service.ts
  utils/
    time.util.ts
```

## Auth Model

- 注册和登录都返回 `AuthResponseDto`
- JWT payload 包含：
  - `sub`
  - `email`
  - `role`
- JWT 提取顺序：
  1. `access_token` cookie
  2. Bearer Token

## Configuration Notes

- 配置键集中在 `src/config/config-key.enum.ts`
- 校验 schema 位于 `src/config/validation.schema.ts`
- `FRONTEND_HOST` 是 CORS 来源的首选配置键
- 为兼容旧配置，`app.config.ts` 仍支持 `HOST` 作为回退来源

## Data and Infrastructure

- 数据访问来自 `@next-nest-turbo-auth-boilerplate/db`
- Prisma schema 在 `packages/db/prisma/schema.prisma`
- 健康检查会检测数据库可达性
- Redis 服务同时维护 publisher / subscriber 两个连接

## Current Gaps

- 单元测试文件缺失
- E2E 配置文件缺失
- CORS 配置存在变量名漂移
