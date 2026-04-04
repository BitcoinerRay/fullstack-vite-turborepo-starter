# Runbook

这份文档聚焦运维、排障和环境恢复。项目介绍、仓库结构和新手启动流程请看根目录 [README.md](../README.md)。

## 本地运行拓扑

- 基础设施：`docker-compose.yml` 管理 Postgres 与 Redis
- 应用：前端与后端都在宿主机运行
- 前端入口：<http://localhost:3000>
- 后端健康检查：<http://localhost:4000/api/v1/health>
- Swagger：<http://localhost:4000/api/docs>

## 日常启动与停止

### 启动基础设施

```bash
npm run infra:start
npm run infra:health
```

### 启动应用

```bash
npm run dev
```

或一条命令串起来：

```bash
npm run dev:all
```

### 关闭或查看基础设施

```bash
npm run infra:stop
npm run infra:restart
npm run infra:logs
npm run infra:ps
```

## 健康检查与观察点

| 检查项                | 路径 / 命令            | 期望结果                                        |
| --------------------- | ---------------------- | ----------------------------------------------- |
| Postgres / Redis 容器 | `npm run infra:health` | 容器处于 `running`，Postgres 最好显示 `healthy` |
| 后端 API              | `GET /api/v1/health`   | 返回 200，payload 中数据库状态为 `up`           |
| Swagger               | `GET /api/docs`        | 在 `ENABLE_SWAGGER=true` 时可访问               |
| 前端静态入口          | `GET /`                | 能打开登录流或首页                              |

## 常见问题排查

| 现象                     | 首先检查什么                | 进一步动作                                                                                     |
| ------------------------ | --------------------------- | ---------------------------------------------------------------------------------------------- |
| 后端连不上数据库         | `npm run infra:health`      | 确认根级 `.env.development` 中 `DATABASE_URL` 与 Docker 实际端口一致                           |
| Redis 连接失败           | `npm run infra:health`      | 检查 `REDIS_URL` 是否与根级 `.env` 覆盖值匹配                                                  |
| Swagger 打不开           | `ENABLE_SWAGGER`            | 确认当前启动模式读取的是根级 `.env.development` 或 `.env.production`                           |
| 前端 API 全部 401        | 浏览器 cookie、`JWT_SECRET` | 看登录接口是否成功写入 `access_token` cookie                                                   |
| 前端请求不到后端         | Vite 代理、后端端口         | 核对 `apps/vite-frontend/vite.config.ts` 的 `/api/v1` 代理目标是否仍为 `http://localhost:4000` |
| 自定义 CORS 来源不生效   | 根级环境变量                | 确认根级 `.env.development` 或 `.env.production` 中的 `FRONTEND_HOST` 是否与前端实际地址一致   |
| 点击 Footer 链接进入 404 | 路由本身缺失                | 当前只实现了首页、登录、注册、错误页和 404 页                                                  |

## 数据库操作

### Prisma 命令

```bash
npm run db:generate -w packages/db
npm run migrate:dev -w packages/db
npm run migrate:deploy -w packages/db
npm run migrate:status -w packages/db
npm run db:seed -w packages/db
npm run db:studio -w packages/db
```

### 容器级备份与恢复

导出：

```bash
docker compose exec postgres pg_dumpall -U postgres > backup.sql
```

恢复：

```bash
cat backup.sql | docker compose exec -T postgres psql -U postgres
```

进入数据库 shell：

```bash
docker compose exec postgres psql -U postgres -d nest_boilerplate
```

## 部署说明

当前仓库提供的是“可选容器化构建文件”，不是完整部署平台配置：

- `deploy/nestjs-backend.dockerfile`
- `deploy/vite-frontend.dockerfile`
- `deploy/vite-frontend.nginx.conf`

标准发布前步骤通常应至少包括：

1. `npm ci`
2. `npm run build`
3. 为生产环境准备真实的 `.env.production` 等价配置
4. 启动后检查：
   - `/api/v1/health`
   - `/api/docs`（如开启）
   - 前端登录链路

## 回滚建议

### 应用回滚

- 回到上一个可用 tag / commit
- 重新构建并部署对应版本

### 数据回滚

- 优先使用 Prisma 迁移策略
- 如果是高风险改动，应先有数据库备份，再执行迁移

### 基础设施重置

```bash
npm run infra:stop
npm run infra:start
```

如果问题来自卷数据，则需要人工决定是否删除 Docker volume；这一步会破坏本地数据，不应作为默认排障动作。

## 当前运行手册中的限制

- 本仓库当前没有可用的自动化单测/E2E 流程可作为运维验收
- `npm run init` 不是可靠的恢复手段，因为它依赖不存在的 `.env.example`
- 根级 `.env.production` 目前更像示例值，而不是经过真实部署验证的生产模板
