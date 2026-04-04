# DB Package

`packages/db` 负责 Prisma schema、迁移、客户端生成，以及提供给 NestJS 的 `PrismaService` / `PrismaModule`。项目级说明请先看根目录 [README.md](../../README.md)。

## 当前导出

- `PrismaClient`
- `PrismaService`
- `PrismaModule`
- Prisma 常见错误类型
- `User` 类型

## 目录结构

```text
prisma/
  schema.prisma
  migrations/
  seed.ts
scripts/
  load-env.mjs
src/
  index.ts
  prisma.module.ts
  prisma.service.ts
```

## 常用命令

```bash
npm run build -w packages/db
npm run db:generate -w packages/db
npm run migrate:dev -w packages/db
npm run migrate:deploy -w packages/db
npm run migrate:status -w packages/db
npm run db:seed -w packages/db
npm run db:studio -w packages/db
```

## 环境变量

必需项：

- `DATABASE_URL`

当前 Prisma 命令通过 `scripts/load-env.mjs` 从根级环境配置加载变量，因此要优先检查仓库根目录的 `.env.development` / `.env.production` 是否正确。

## 当前数据模型

- `User`
- `UserRole`
- `mikro_orm_migrations`（兼容遗留表，已忽略）
