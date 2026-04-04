# Data Models and Schemas

**Updated:** 2026-04-04

## Prisma Schema

- 位置：`packages/db/prisma/schema.prisma`
- 迁移目录：`packages/db/prisma/migrations/`

### Current Models

| 模型                   | 说明                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| `User`                 | 当前唯一真实业务模型，字段包含 `id`、`email`、`passwordHash`、`role`、`createdAt`、`updatedAt` |
| `mikro_orm_migrations` | 兼容旧迁移体系的遗留表，已 `@@ignore`                                                          |

### Current Enums

| 枚举       | 位置                              | 说明                   |
| ---------- | --------------------------------- | ---------------------- |
| `UserRole` | Prisma schema / `packages/shared` | 当前有 `USER`、`ADMIN` |

## Shared DTO Contract

`packages/shared/src/index.ts` 当前真正导出的是以下对象：

| 导出项            | 位置                                 | 作用             |
| ----------------- | ------------------------------------ | ---------------- |
| `LoginDto`        | `src/dtos/auth/login.dto.ts`         | 登录请求体       |
| `RegisterDto`     | `src/dtos/auth/register.dto.ts`      | 注册请求体       |
| `AuthResponseDto` | `src/dtos/auth/auth-response.dto.ts` | 登录/注册响应体  |
| `UserDto`         | `src/dtos/user/user.dto.ts`          | 用户展示结构     |
| `UpdateUserDto`   | `src/dtos/user/update-user.dto.ts`   | 用户更新结构占位 |
| `UserRole`        | `src/enums/user-role.enum.ts`        | 角色枚举         |

## Backend Config Schema

- 配置键：`apps/nestjs-backend/src/config/config-key.enum.ts`
- 校验规则：`apps/nestjs-backend/src/config/validation.schema.ts`

当前覆盖的配置域包括：

- 应用运行环境
- 端口与 Swagger
- 数据库连接
- Redis 连接
- JWT 配置

## DB Package Exports

`packages/db/src/index.ts` 当前导出：

- `PrismaClient`
- `PrismaService`
- `PrismaModule`
- Prisma 常见错误类型
- `User` 类型

## Data Notes

- 当前仓库还没有独立的“业务领域模型层”，DTO 与 Prisma model 之间的映射主要集中在后端 service
- 用户 DTO 已经与 Prisma model 分离，`UsersService.toDto()` 是当前转换入口
