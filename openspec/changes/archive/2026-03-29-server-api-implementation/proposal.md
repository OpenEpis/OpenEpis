## Why

The server app (`@openepis/server`) currently only has a health-check endpoint. All the storage interfaces and PostgreSQL implementations are built (`@openepis/storage`, `@openepis/storage-pg`), and the API types are defined (`@openepis/types`), but there is no actual API to connect them. We need to implement the REST endpoints defined in `docs/mvp.md` so the Web UI and Claude Code Skill can interact with the system.

Additionally, `registerPostgresStorage` in `storage-pg` couples a specific DI container call to the storage package. DI registration belongs in the composition root (the server), not in the library.

The API endpoints MUST match the SDK (`@openepis/sdk`) paths, parameters, and return types exactly — the SDK is the contract, and the server must conform to it.

## What Changes

- Implement all MVP-0 REST API endpoints in `@openepis/server` using Fastify, backed by `@openepis/storage-pg`
- All endpoints MUST match SDK paths and return types from `@openepis/types` exactly
- Wire up DI in the server: create a lightweight DI container (`Container` class) that registers `IStorageService` implementations by token, enabling different storage backends (PostgreSQL, in-memory for testing, etc.) to be swapped via configuration
- **BREAKING**: Remove `registerPostgresStorage` and `container.ts` from `@openepis/storage-pg`, and drop the `tsyringe` dependency from that package
- Remove `STORAGE_SERVICE` token from `@openepis/storage` (no longer needed without tsyringe DI)
- Add `@openepis/storage` and `@openepis/storage-pg` as dependencies of `@openepis/server`

## Capabilities

### New Capabilities

- `project-api`: CRUD endpoints for projects — `GET /api/projects`, `GET /api/projects/:id`, `POST /api/projects`, `PUT /api/projects/:id`, `DELETE /api/projects/:id`
- `repository-api`: Repository management — `GET /api/projects/:id/repositories`, `POST /api/projects/:id/repositories`, `DELETE /api/repositories/:id`
- `feature-api`: Feature CRUD with revision tracking — `GET /api/projects/:id/features` (with query filters), `GET /api/features/:id`, `POST /api/projects/:id/features`, `PUT /api/features/:id`, `GET /api/features/:id/revisions`, `GET /api/features/:id/revisions/:version`
- `task-api`: Async task status + BDD init trigger — `GET /api/tasks/:id`, `POST /api/projects/:id/init`
- `context-api`: BDD context lookup — `POST /api/projects/:id/context`
- `server-di`: Server-side composition root that wires storage to routes, removes tsyringe coupling

### Modified Capabilities

## Impact

- `apps/server/` — major changes: new route files, DI setup, server bootstrap rewrite
- `packages/storage-pg/` — remove `container.ts`, `registerPostgresStorage` export, drop `tsyringe` dependency
- `packages/storage/` — remove `STORAGE_SERVICE` token, `token.ts`
- `packages/types/` — no changes expected (types already defined and match SDK needs)
- `packages/sdk/` — no changes needed (server must conform to the SDK contract)
