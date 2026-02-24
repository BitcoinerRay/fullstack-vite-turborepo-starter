# Contributing

## Development Workflow

1. Install root deps: `npm install`
2. Copy environment files:
   ```bash
   cp .env.example .env
   cp apps/vite-frontend/.env.example apps/vite-frontend/.env
   cp apps/nestjs-backend/.env.example apps/nestjs-backend/.env
   ```
3. Ensure `DATABASE_URL` and Redis credentials in `apps/nestjs-backend/.env` match root `.env` (used by docker-compose).
4. Start infrastructure (from root): `npm run infra:start`
5. Wait for Postgres: `npm run infra:health` until postgres shows `healthy`.
6. Prisma (in `packages/db`): `npm run db:generate` then `npm run migrate:dev` (or `migrate:deploy` for apply-only).
7. Start apps: `npm run dev` (from root), or one-shot: `npm run dev:all`.

## Scripts Reference

Source: root `package.json`.

| Script        | Command                                       | Description                 |
| ------------- | --------------------------------------------- | --------------------------- |
| infra:start   | `docker compose up -d`                        | Start Postgres, Redis       |
| infra:stop    | `docker compose down`                         | Stop infrastructure         |
| infra:restart | `docker compose down && docker compose up -d` | Restart infrastructure      |
| infra:logs    | `docker compose logs -f`                      | Follow infrastructure logs  |
| infra:ps      | `docker compose ps`                           | List containers             |
| infra:health  | `docker compose ps`                           | Check service status        |
| dev           | `turbo run dev --parallel`                    | Run all apps in dev mode    |
| dev:all       | `npm run infra:start && npm run dev`          | Start infra then dev        |
| build         | `turbo run build`                             | Build all apps and packages |
| start:dev     | `turbo run start:dev`                         | Run apps in dev mode        |
| start:prod    | `turbo run start:prod`                        | Run apps in production mode |
| lint          | `turbo run lint --`                           | Lint workspace              |
| lint:fix      | `turbo run lint:fix --`                       | Lint with autofix           |
| test:unit     | `turbo run test:unit`                         | Unit tests                  |
| test:e2e      | `turbo run test:e2e`                          | E2E tests                   |
| test:unit:cov | `turbo run test:unit:cov`                     | Unit tests with coverage    |
| format        | `prettier --write "**/*.{ts,tsx,md}"`         | Format code                 |
| prepare       | `husky`                                       | Git hooks                   |

## Environment Setup

### Root `.env` (infrastructure — used by docker-compose only)

Source: `.env.example`.

| Variable          | Purpose           | Format / Default |
| ----------------- | ----------------- | ---------------- |
| POSTGRES_PORT     | PostgreSQL port   | 5432             |
| POSTGRES_DB       | Database name     | nest_boilerplate |
| POSTGRES_USER     | Database user     | postgres         |
| POSTGRES_PASSWORD | Database password | postgres         |
| POSTGRES_TIMEZONE | DB timezone       | UTC              |
| REDIS_PORT        | Redis port        | 6379             |
| REDIS_PASSWORD    | Redis password    | redis_pass       |

### Backend `apps/nestjs-backend/.env`

Source: `apps/nestjs-backend/.env.example`. Credentials should match root `.env`.

| Variable            | Purpose             | Format                                    |
| ------------------- | ------------------- | ----------------------------------------- |
| NODE_ENV            | Environment         | development \| staging \| production      |
| PORT                | API port            | number (default 4000)                     |
| ENABLE_SWAGGER      | Swagger UI          | true \| false                             |
| FRONTEND_HOST       | CORS origin         | URL (e.g. http://localhost:3000 for Vite) |
| DATABASE_URL        | Postgres connection | postgresql://user:pass@host:port/db       |
| REDIS_URL           | Redis connection    | redis://:pass@host:port                   |
| POSTGRES_DEBUG_MODE | ORM debug           | true \| false                             |

### Frontend `apps/vite-frontend/.env`

Source: `apps/vite-frontend/.env.example`. Vite exposes only `VITE_`-prefixed variables to the client; ensure names match what the app reads (see `apps/vite-frontend` usage).

| Variable                | Purpose      | Format                           |
| ----------------------- | ------------ | -------------------------------- |
| NEXT_PUBLIC_NODE_ENV    | Environment  | development \| production        |
| NEXT_PUBLIC_BACKEND_URL | API base URL | URL (e.g. http://localhost:4000) |

## Docker and Daily Dev

- Infrastructure (Postgres, Redis) runs in Docker; apps run on the host via `npm run dev`.
- Optional containerized app builds for CI/CD: see `deploy/` (e.g. `deploy/vite-frontend.dockerfile`, `deploy/nestjs-backend.dockerfile`).

## Database Operations

From repo root:

```bash
# Export
docker compose exec postgres pg_dumpall -U postgres > backup.sql

# Restore
cat backup.sql | docker compose exec -T postgres psql -U postgres

# Shell
docker compose exec postgres psql -U postgres -d nest_boilerplate
```

Migrations: `packages/db` (Prisma) — `npm run migrate:dev`, `migrate:deploy`, `migrate:status`, `db:studio`, etc.

## Testing Procedures

- Unit: `npm run test:unit` (root)
- Unit coverage: `npm run test:unit:cov`
- E2E: `npm run test:e2e` (root; backend Jest e2e + frontend Playwright)
