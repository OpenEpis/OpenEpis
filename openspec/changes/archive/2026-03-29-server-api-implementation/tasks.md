## 1. Remove tsyringe coupling

- [x] 1.1 Delete `packages/storage-pg/src/container.ts`
- [x] 1.2 Remove `registerPostgresStorage` export from `packages/storage-pg/src/index.ts`
- [x] 1.3 Remove `@injectable()` decorator and `reflect-metadata` import from `PostgresStorageService`
- [x] 1.4 Remove `tsyringe` and `reflect-metadata` from `packages/storage-pg/package.json` dependencies
- [x] 1.5 Delete `packages/storage/src/token.ts` and remove `STORAGE_SERVICE` export from `packages/storage/src/index.ts`

## 2. Server DI container

- [x] 2.1 Add `@openepis/storage`, `@openepis/storage-pg`, and `dotenv` as dependencies of `@openepis/server`
- [x] 2.2 Create `apps/server/src/container.ts` — `Container` class with typed token registry (`TOKENS`), `register()`, `resolve()` (lazy singleton), and `dispose()` methods. `TokenMap` maps `TOKENS.StorageService` → `IStorageService`
- [x] 2.3 Create `apps/server/src/errors.ts` — `AppError` class and Fastify error handler returning `ApiError` format
- [x] 2.4 Rewrite `apps/server/src/index.ts` as composition root: create `Container`, register `PostgresStorageService` factory for `TOKENS.StorageService`, register route plugins with container in options, set error handler, add graceful shutdown via `container.dispose()`

## 3. Route plugins — must match SDK paths and return types exactly

All route plugins receive the `Container` via plugin options and resolve `IStorageService` from it. No route plugin SHALL import `PostgresStorageService` directly.

- [x] 3.1 Create `apps/server/src/routes/projects.ts` — `GET /api/projects` → `ProjectListResponse`, `GET /api/projects/:id` → `ProjectDetailResponse`, `POST /api/projects` → `Project`, `PUT /api/projects/:id` → `Project`, `DELETE /api/projects/:id` → 204
- [x] 3.2 Create `apps/server/src/routes/repositories.ts` — `GET /api/projects/:id/repositories` → `RepositoryListResponse`, `POST /api/projects/:id/repositories` → `Repository`, `DELETE /api/repositories/:id` → 204
- [x] 3.3 Create `apps/server/src/routes/features.ts` — `GET /api/projects/:id/features` (with `status`, `tag`, `search` query params) → `FeatureListResponse`, `GET /api/features/:id` → `FeatureDetailResponse`, `POST /api/projects/:id/features` → `Feature`, `PUT /api/features/:id` → `Feature`, `GET /api/features/:id/revisions` → `FeatureRevisionsResponse`, `GET /api/features/:id/revisions/:version` → `FeatureDetailResponse`
- [x] 3.4 Create `apps/server/src/routes/tasks.ts` — `GET /api/tasks/:id` → `TaskStatusResponse`, `POST /api/projects/:id/init` → `AsyncTaskResponse` (202)
- [x] 3.5 Create `apps/server/src/routes/context.ts` — `POST /api/projects/:id/context` → `ContextResponse` (stub returning `{ "related_features": [] }`)

## 4. Verification

- [x] 4.1 Verify `packages/storage-pg` builds without tsyringe
- [x] 4.2 Verify `apps/server` builds and starts successfully
- [x] 4.3 Verify every endpoint's path, HTTP method, and response type matches the SDK contract (cross-reference `packages/sdk/src/resources/*.ts`)
- [x] 4.4 Verify route plugins resolve `IStorageService` from container, not importing `PostgresStorageService` directly
