## Why

The OpenEpis backend needs a persistence layer. No database code exists yet.

## What Changes

- `@openepis/storage`: Pure interface package
- `@openepis/storage-pg`: PostgreSQL implementation with Drizzle ORM
- Root-level `db:pg:*` scripts, dotenv for DATABASE_URL

## Capabilities

### New Capabilities

- `storage-interface`: Abstract IStorageService interface
- `postgresql-storage`: Concrete PostgreSQL implementation

### Modified Capabilities

_None_

## Impact

- New packages: `packages/storage`, `packages/storage-pg`
- `.env.example` and root `db:pg:*` scripts added
