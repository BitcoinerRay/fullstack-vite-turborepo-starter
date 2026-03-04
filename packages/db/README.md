# @next-nest-turbo-auth-boilerplate/db

Shared database package for the monorepo using Prisma ORM.

## Features

- **Prisma Client**: Type-safe database access
- **Migrations**: Database schema versioning with Prisma Migrate
- **NestJS Integration**: Ready-to-use `PrismaService` and `PrismaModule`

## Usage

### In NestJS Applications

```typescript
import {PrismaModule} from '@next-nest-turbo-auth-boilerplate/db';

@Module({
  imports: [PrismaModule],
  // ...
})
export class AppModule {}
```

### Direct Prisma Client Usage

```typescript
import {PrismaClient} from '@next-nest-turbo-auth-boilerplate/db';

const prisma = new PrismaClient();
```

## Scripts

- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database (development)
- `npm run db:pull` - Pull schema from database
- `npm run db:studio` - Open Prisma Studio
- `npm run migrate:dev` - Create and apply migrations (development)
- `npm run migrate:deploy` - Apply migrations (production)
- `npm run migrate:status` - Check migration status

## Environment Variables

Required:

- `DATABASE_URL` - PostgreSQL connection string

Example:

```
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
```
