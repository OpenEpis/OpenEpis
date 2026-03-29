## Context

The server (`apps/server`) is a Fastify app with only a `/api/health` endpoint. The storage layer is fully implemented: `@openepis/storage` defines interfaces (`IStorageService` with sub-stores like `IProjectStorage`, `IFeatureStorage`, etc.), and `@openepis/storage-pg` provides PostgreSQL implementations via Drizzle ORM. The types package defines all request/response shapes. The SDK (`@openepis/sdk`) defines the client-side contract — paths, parameters, and return types.

Currently `storage-pg` has a `registerPostgresStorage()` function that registers itself with `tsyringe`, coupling a library package to a specific DI container. The server doesn't use `tsyringe` — it's a clean slate.

**The SDK is the source of truth for the API contract.** The server MUST implement endpoints that match the SDK's paths, HTTP methods, request types, and response types exactly.

## Goals / Non-Goals

**Goals:**

- Implement all MVP-0 REST API endpoints matching the SDK contract exactly
- Every endpoint's return type MUST match the corresponding `@openepis/types` type
- Wire `PostgresStorageService` directly in the server (composition root pattern)
- Remove tsyringe coupling from `storage-pg`
- Consistent error responses matching `ApiError` type
- Fastify plugin architecture for route organization

**Non-Goals:**

- Authentication / authorization (MVP-1)
- BDD initialization pipeline worker (stub only — creates async_task record)
- Context endpoint LLM integration (stub only — returns empty result)
- Request body validation beyond basic null checks (follow-up)
- Database migrations (already handled separately)

## Decisions

### 1. SDK defines the contract, server conforms

**Decision**: The SDK's paths and return types are authoritative. The server implements them verbatim.

**Key alignment points** (from SDK analysis):
| SDK method | Server endpoint | Return type |
|---|---|---|
| `projects.list()` | `GET /api/projects` | `ProjectListResponse` |
| `projects.get(id)` | `GET /api/projects/:id` | `ProjectDetailResponse` |
| `projects.create(data)` | `POST /api/projects` | `Project` |
| `projects.update(id, data)` | `PUT /api/projects/:id` | `Project` |
| `projects.delete(id)` | `DELETE /api/projects/:id` | `void` (204) |
| `repositories.list(pid)` | `GET /api/projects/:id/repositories` | `RepositoryListResponse` |
| `repositories.create(pid, data)` | `POST /api/projects/:id/repositories` | `Repository` |
| `repositories.delete(id)` | `DELETE /api/repositories/:id` | `void` (204) |
| `features.list(pid, query?)` | `GET /api/projects/:id/features?status=&tag=&search=` | `FeatureListResponse` |
| `features.get(id)` | `GET /api/features/:id` | `FeatureDetailResponse` |
| `features.create(pid, data)` | `POST /api/projects/:id/features` | `Feature` |
| `features.update(id, data)` | `PUT /api/features/:id` | `Feature` |
| `features.revisions(id)` | `GET /api/features/:id/revisions` | `FeatureRevisionsResponse` |
| `features.revision(id, ver)` | `GET /api/features/:id/revisions/:version` | `FeatureDetailResponse` |
| `tasks.get(id)` | `GET /api/tasks/:id` | `TaskStatusResponse` |
| `init.trigger(pid, data?)` | `POST /api/projects/:id/init` | `AsyncTaskResponse` (202) |
| `context.query(pid, data)` | `POST /api/projects/:id/context` | `ContextResponse` |

### 2. Lightweight DI container for IStorageService

**Decision**: Create a simple DI container (`apps/server/src/container.ts`) that holds service registrations keyed by interface token. The server's composition root registers a concrete `IStorageService` factory (e.g., `PostgresStorageService`), and route plugins resolve it from the container. No heavy DI framework (tsyringe, inversify, etc.) — just a typed Map-based registry.

**Rationale**: The system will support multiple `IStorageService` implementations over time (e.g., in-memory for testing, other databases). A simple DI container decouples route handlers from any specific storage implementation while keeping the code lightweight. Fastify's plugin options pass the container to routes.

**Container design**:

```typescript
// apps/server/src/container.ts
import type { IStorageService } from "@openepis/storage";

export const TOKENS = {
  StorageService: Symbol.for("IStorageService"),
} as const;

type TokenMap = {
  [TOKENS.StorageService]: IStorageService;
};

export class Container {
  private instances = new Map<symbol, unknown>();
  private factories = new Map<symbol, () => unknown>();

  register<K extends keyof TokenMap>(token: K, factory: () => TokenMap[K]): void {
    this.factories.set(token, factory);
  }

  resolve<K extends keyof TokenMap>(token: K): TokenMap[K] {
    if (this.instances.has(token)) {
      return this.instances.get(token) as TokenMap[K];
    }
    const factory = this.factories.get(token);
    if (!factory) throw new Error(`No registration for token: ${String(token)}`);
    const instance = factory() as TokenMap[K];
    this.instances.set(token, instance);
    return instance;
  }

  async dispose(): Promise<void> {
    const storage = this.instances.get(TOKENS.StorageService) as IStorageService | undefined;
    if (storage) await storage.disconnect();
    this.instances.clear();
    this.factories.clear();
  }
}
```

**Composition root usage**:

```typescript
// apps/server/src/index.ts
const container = new Container();
container.register(TOKENS.StorageService, () => new PostgresStorageService());

// Route plugins receive the container
app.register(projectRoutes, { container });
```

**Route plugin usage**:

```typescript
// routes/projects.ts
const storage = opts.container.resolve(TOKENS.StorageService);
```

### 3. Fastify plugin per resource

**Decision**: One Fastify plugin file per API resource.

```
apps/server/src/
  index.ts              — bootstrap, register services in container, register plugins
  container.ts          — lightweight DI container (Token registry + resolve)
  errors.ts             — AppError class and error handler
  routes/
    projects.ts         — /api/projects routes
    repositories.ts     — /api/projects/:id/repositories + /api/repositories/:id
    features.ts         — /api/projects/:id/features + /api/features/:id
    tasks.ts            — /api/tasks/:id + /api/projects/:id/init
    context.ts          — /api/projects/:id/context
```

### 4. Remove tsyringe coupling

**Decision**: Remove `STORAGE_SERVICE` token from `@openepis/storage`, remove `container.ts` and `@injectable()` decorator from `@openepis/storage-pg`. The server's own DI container (`apps/server/src/container.ts`) defines its own tokens and manages lifecycle — no library packages reference any DI framework.

### 5. Error handling

**Decision**: Global error handler returns `ApiError` format. Route handlers throw `AppError` with status code and error code. All error responses match `{ error: { code: string, message: string } }`.

### 6. Graceful shutdown

**Decision**: Listen for SIGTERM/SIGINT, call `container.dispose()` (which disconnects storage) then `app.close()`.

## Risks / Trade-offs

- **[No input validation]** → MVP accepts this; will add schema validation in a follow-up.
- **[Init endpoint is a stub]** → Creates async_task record but doesn't run pipeline. Acceptable for MVP-0.
- **[Context endpoint is a stub]** → Returns empty `related_features`. Acceptable for MVP-0.
- **[No auth means created_by is hardcoded]** → Endpoints needing `created_by` use a placeholder or accept it from request body. MVP-1 adds real auth.
- **[Feature list search is basic]** → Uses SQL `ILIKE` on title/description, not full-text search. Good enough for MVP-0 scale.
