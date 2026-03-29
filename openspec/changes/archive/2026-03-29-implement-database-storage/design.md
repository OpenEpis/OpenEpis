## Context

Monorepo with `@openepis/types` and `@openepis/sdk`. Fastify backend needs PostgreSQL persistence.

## Goals / Non-Goals

**Goals:** Interface-first storage with DI, Drizzle ORM, drizzle-kit migrations, 11 tables
**Non-Goals:** Connection pooling, caching, multi-tenancy, seeding

## Decisions

1. Two packages: `@openepis/storage` (interface) + `@openepis/storage-pg` (implementation)
2. Drizzle ORM with postgres.js driver
3. TSyringe DI with STORAGE_SERVICE token
4. Entity-namespaced sub-interfaces
5. One schema file per table in `packages/storage-pg/src/schema/`
6. drizzle-kit for migrations
7. dotenv for DATABASE_URL
8. Root scripts: `db:pg:generate/migrate/push/studio`

## Risks / Trade-offs

- Date/string mismatch handled via mapRow helper
- reflect-metadata required at entry point
- experimentalDecorators enabled in tsconfig
