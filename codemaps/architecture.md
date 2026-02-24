# Architecture

**Updated:** 2026-02-13

## Overview

Turborepo monorepo with Vite frontend and NestJS backend.

```
apps/
  nestjs-backend/   # API (Express)
  vite-frontend/    # Vite + React (CSR)
packages/
  db/               # Prisma ORM + PostgreSQL
  shared/           # Shared types/utils
```

## Dependency Graph

- **Root:** turbo, husky, prettier, commitlint
- **Backend →** @nestjs/\*, @next-nest-turbo-auth-boilerplate/db, ioredis, joi, helmet, cookie-parser
- **Database →** @prisma/client, prisma
- **Frontend →** vite, react, react-router-dom, react-i18next, @tanstack/react-query, zustand, zod, react-helmet-async
- **Shared →** used by both apps (internal)

## Build Pipeline

- **turbo.json** - build depends on ^build and ^db:generate
- **Outputs:** dist/\*\* (backend + frontend), node_modules/.prisma/client (db)
- **Tasks:** build, db:generate, dev, start:dev, start:prod, lint, lint:fix, format, test:unit, test:unit:cov, test:e2e

## Cross-App

- **API prefix:** /api
- **CORS:** FRONTEND_HOST (e.g. http://localhost:3000 for Vite dev)
- **Swagger:** /api/docs (when ENABLE_SWAGGER=true)

## Deploy

- deploy/vite-frontend.dockerfile, deploy/vite-frontend.nginx.conf
- deploy/nestjs-backend.dockerfile
