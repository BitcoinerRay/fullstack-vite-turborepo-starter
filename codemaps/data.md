# Data Models & Schemas

**Updated:** 2026-02-13

## Database Models (Prisma)

### Schema Location

- packages/db/prisma/schema.prisma
- Migrations: packages/db/prisma/migrations/

### Models

- Dummy: id (UUID), createdAt, updatedAt (placeholder)
- mikro_orm_migrations: @@ignore (compatibility)

## Config Schemas

### ConfigKey (Backend)

- config/config-key.enum.ts
- Keys: NODE*ENV, FRONTEND_HOST, PORT, ENABLE_SWAGGER, POSTGRES*\_, REDIS\_\_

### Validation (Backend)

- config/validation.schema.ts — Joi schema for env vars

## Frontend Types (vite-frontend)

- FloatLabelInputTextProps → components/float-label-input-text/types/
- ErrorResponse (backend): nestjs-backend common/filters/prisma-exception/types/

## Shared Packages

### packages/shared

- src/index.ts — empty; reserved for shared DTOs/types

### packages/db

- Prisma schema and migrations
- Exports: PrismaClient, PrismaService, PrismaModule
