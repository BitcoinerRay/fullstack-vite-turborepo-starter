# Runbook

## Development Setup

- **Infrastructure** (Postgres, Redis): Docker. **Applications** (Vite frontend, NestJS): run on host via `npm run dev` for HMR and debugging.

Start infra (from root):

```bash
npm run infra:start
npm run infra:health   # wait until postgres is healthy
```

Start apps:

```bash
npm run dev            # infra already running
# or
npm run dev:all        # start infra then dev in one command
```

Per-app (from root):

```bash
cd apps/vite-frontend && npm run dev     # frontend (e.g. port 3000)
cd apps/nestjs-backend && npm run dev    # port 4000
```

Manage infra:

```bash
npm run infra:stop
npm run infra:restart
npm run infra:logs
npm run infra:ps
```

## Deployment Procedures

- Install: `npm ci`
- Build: `npm run build`
- Run production: `npm run start:prod`
  - Backend: default port 4000
  - Frontend: default port (Vite, e.g. 3000)

Containerized builds (e.g. CI/CD): use `deploy/vite-frontend.dockerfile`, `deploy/vite-frontend.nginx.conf`, and `deploy/nestjs-backend.dockerfile` as needed; not required for daily dev.

## Monitoring and Alerts

- Backend health: `GET /api/health` (200 when DB reachable).
- Swagger (when `ENABLE_SWAGGER=true`): `GET /api/docs`.

## Common Issues and Fixes

| Issue                                        | Fix                                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------------- |
| App can't connect to DB on first run         | Wait for Postgres (5–10s); `npm run infra:health` until `healthy`.                           |
| Port 5432 already in use                     | Stop other Postgres or change `POSTGRES_PORT` in root `.env` and restart infra.              |
| Frontend dev lock / "Unable to acquire lock" | Stop other dev servers; remove any lock files in `apps/vite-frontend` if stuck.              |
| Migration fails                              | Infra running; `DATABASE_URL` in `apps/nestjs-backend/.env` matches root `.env`.             |
| CORS errors                                  | Set `FRONTEND_HOST` in `apps/nestjs-backend/.env` to frontend origin.                        |
| Redis connection failed                      | `npm run infra:health`; `npm run infra:restart` if needed.                                   |
| Shared package not found                     | Build packages: e.g. `cd packages/db && npm run build`; root `npm run build` builds all.     |
| Port 3000 or 4000 in use                     | Stop conflicting process or change `PORT` (backend) / configure Vite server port (frontend). |

## Database Operations

Export:

```bash
docker compose exec postgres pg_dumpall -U postgres > backup.sql
```

Restore:

```bash
cat backup.sql | docker compose exec -T postgres psql -U postgres
```

## Rollback Procedures

1. **Application:** Redeploy previous image or git tag.
2. **Database migrations:** Use Prisma in `packages/db` (e.g. revert migration or redeploy prior revision).
3. **Infrastructure:** `npm run infra:stop`.
