# Fullstack Vite Turborepo

Monorepo: **Vite** frontend and **NestJS** backend, managed with **Turborepo**. Built for scalability, type safety, and developer experience.

---

## Getting Started

**Requirements:** Node 24.x, npm 11.x (see `package.json` engines).

### One-command setup

```bash
git clone <your-repo-url>
cd fullstack-vite-turborepo-starter
npm install

cp .env.example .env
cp apps/vite-frontend/.env.example apps/vite-frontend/.env
cp apps/nestjs-backend/.env.example apps/nestjs-backend/.env

npm run infra:start
npm run infra:health   # wait until healthy

cd packages/db && npm run db:generate && npm run migrate:deploy && cd ../..
npm run dev
```

Edit `apps/nestjs-backend/.env` so `DATABASE_URL` matches the Postgres settings in the root `.env`.

**URLs:** Frontend http://localhost:5173 · Backend http://localhost:4000

### Step-by-step

1. Clone, then `npm install`.
2. Copy `.env.example` → `.env` in repo root, `apps/vite-frontend`, and `apps/nestjs-backend`.
3. `npm run infra:start` then `npm run infra:health` (Docker: Postgres, Redis).
4. `cd packages/db && npm run db:generate && npm run migrate:deploy && cd ../..`
5. `npm run dev` (Vite + NestJS in parallel).

Infrastructure runs in Docker; apps run on the host for HMR and debugging.

---

## Tech Stack

| Layer    | Path                  | Stack                                                                                         |
| -------- | --------------------- | --------------------------------------------------------------------------------------------- |
| Frontend | `apps/vite-frontend`  | Vite, React, TypeScript, Tailwind, React Hook Form, Zod, React Query, react-i18next (en/中文) |
| Backend  | `apps/nestjs-backend` | NestJS, TypeScript, Prisma, PostgreSQL, class-validator                                       |
| Shared   | `packages/shared`     | Shared types & DTOs, type-safe API contracts                                                  |
| DB       | `packages/db`         | Prisma schema, migrations, generated client                                                   |

Details: [apps/vite-frontend/README.md](./apps/vite-frontend/README.md), [apps/nestjs-backend/readme.md](./apps/nestjs-backend/readme.md), [packages/shared/README.md](./packages/shared/README.md), [packages/db/README.md](./packages/db/README.md).

---

## Architecture & Configuration

### Docker Strategy

This template uses Docker **only for development infrastructure** (Postgres, Redis via Docker Compose).

- ✅ `npm run infra:start` - Start databases locally
- ✅ Frontend/Backend run on **host** for HMR and debugging
- ❌ No application containerization (deploy using your preferred platform)

**Why this approach:**

- Fast HMR and hot reload during development
- Native debugging experience
- Deploy to Vercel/Netlify/Railway without Docker complexity
- Infrastructure services isolated in containers

### Turborepo Configuration

Build and test caching is optimized with proper dependency chains:

```json
{
  "test:unit": {
    "dependsOn": ["^build"],
    "outputs": ["coverage/**"]
  }
}
```

- Tests depend only on builds (no circular dependencies)
- Coverage output is cached for faster CI runs
- Parallel execution where possible

### TypeScript Version

All packages use **TypeScript 5.9.3** (latest stable). Unified version ensures:

- Consistent type checking across monorepo
- Predictable builds in CI/CD
- Access to latest language features

---

## Scripts

| Command                                                | Description                                            |
| ------------------------------------------------------ | ------------------------------------------------------ |
| `npm run dev`                                          | Run Vite + NestJS in dev                               |
| `npm run dev:all`                                      | Start infra (Docker) then dev                          |
| `npm run build`                                        | Build all apps and packages (includes Prisma generate) |
| `npm run start:dev` / `start:prod`                     | Run all apps in dev or production mode                 |
| `npm run infra:start` / `infra:stop` / `infra:restart` | Docker Compose for Postgres, Redis                     |
| `npm run infra:logs` / `infra:ps`                      | View Docker logs or container status                   |
| `npm run lint` / `lint:fix`                            | Lint across the monorepo                               |
| `npm run format`                                       | Prettier on TS/TSX/MD                                  |
| `npm run test:unit` / `test:unit:cov` / `test:e2e`     | Run unit or E2E tests                                  |

---

## Contributing

Clone, extend, and customize. Issues and PRs welcome.

**License:** MIT — [LICENSE](./LICENSE)
