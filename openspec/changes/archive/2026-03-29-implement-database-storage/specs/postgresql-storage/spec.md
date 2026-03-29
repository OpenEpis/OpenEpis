## ADDED Requirements

### Requirement: Dedicated PostgreSQL package

`@openepis/storage-pg` in `packages/storage-pg` with Drizzle ORM.

#### Scenario: Package structure

- **WHEN** `@openepis/storage-pg` is installed
- **THEN** it depends on drizzle-orm, postgres, dotenv, @openepis/storage, @openepis/types

### Requirement: Drizzle schema for all tables

11 table schemas with types, FKs, constraints, indexes.

#### Scenario: Schema matches data model

- **WHEN** Drizzle schema is loaded
- **THEN** all tables match docs/data-model.md

### Requirement: PostgresStorageService

Implements IStorageService with Drizzle queries, @injectable().

#### Scenario: CRUD via Drizzle

- **WHEN** storage methods are called
- **THEN** Drizzle queries execute against PostgreSQL

### Requirement: Connection via dotenv

DATABASE_URL from .env, root scripts db:pg:\*.

#### Scenario: Root-level scripts

- **WHEN** pnpm db:pg:generate is run from root
- **THEN** it delegates to @openepis/storage-pg
