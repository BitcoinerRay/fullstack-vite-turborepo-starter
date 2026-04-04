# NestJS Backend

后端 workspace 负责 API、鉴权、健康检查、用户模块和基础设施接入。项目级说明请先看根目录 [README.md](../../README.md)。

## 当前职责

- 暴露 `/api/v1` 前缀下的 REST API
- 处理注册、登录、注销与当前用户查询
- 通过 Prisma 访问 PostgreSQL
- 通过 Redis 提供发布/订阅基础能力
- 提供健康检查与 Swagger

## 关键入口

| 文件                | 作用                                  |
| ------------------- | ------------------------------------- |
| `src/main.ts`       | 挂载全局中间件、过滤器、前缀、Swagger |
| `src/app.module.ts` | 汇总配置、限流、业务模块              |
| `src/auth/`         | JWT 登录流、cookie 写入、鉴权策略     |
| `src/users/`        | 用户查询与 DTO 转换                   |
| `src/health/`       | 数据库健康检查                        |
| `src/config/`       | 配置键、Joi 校验、配置映射            |

## 当前接口

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/users/me`
- `GET /api/v1/health`

Swagger 地址：

- `/api/docs`，前提是 `ENABLE_SWAGGER=true`

## 环境变量说明

后端运行时默认从仓库根目录读取 `.env.development` / `.env.production`，而不是读取 `apps/nestjs-backend/.env`。

当前需要特别注意：

- `FRONTEND_HOST` 现在是后端 CORS 来源的首选配置键，并兼容旧的 `HOST` 作为回退
- 数据库与 Redis 地址以根级 env 为准
- `JWT_SECRET` 是启动必需项

## 常用命令

```bash
npm run dev -w apps/nestjs-backend
npm run build -w apps/nestjs-backend
npm run lint -w apps/nestjs-backend
```

## 当前限制

- CORS 环境变量名与实现不完全一致
- 当前测试基线仍然偏轻量，主要覆盖健康检查链路
