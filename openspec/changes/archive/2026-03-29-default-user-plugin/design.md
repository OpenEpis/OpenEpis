## Context

Routes need to know "who is the current user" to populate `created_by`, `changed_by`, and similar fields. This is a universal requirement regardless of whether authentication exists. Currently there is no unified way to obtain the current user — IDs are hardcoded across various routes, and `tasks.ts` still uses the invalid `"system"` string.

## Goals / Non-Goals

**Goals:**

- Provide unified `request.user` access to the current user; all routes use `request.user.id` instead of hardcoded values
- Use the Fastify plugin pattern for easy replacement with real auth in MVP-1
- Ensure the default system user exists in the database

**Non-Goals:**

- No real authentication (JWT, OAuth, etc.) — that is MVP-1 scope
- No external API interface changes (request/response formats unchanged)
- No new dependencies introduced (except `fastify-plugin`)

## Decisions

### 1. Use Fastify `decorateRequest` + `onRequest` hook

**Choice**: Create a `apps/server/src/plugins/current-user.ts` current-user plugin using `fastify.decorateRequest('user', ...)` to decorate the request, and set the current user in an `onRequest` hook. MVP-0 implementation returns the default user directly; MVP-1 replaces it with real user resolution from JWT/OAuth tokens.

**Alternative**: Import a constant in each route — cannot access via `request.user` uniformly, and every route would need modification when switching to MVP-1.

**Rationale**: Fastify's plugin/decorator pattern is the standard approach. The route layer always accesses the current user via `request.user`, so switching auth strategies only requires replacing this plugin's implementation.

### 2. `request.user` returns `{ id, email, name }` object, not just an ID

**Choice**: Return a full `RequestUser` type (`{ id: string; email: string; name: string }`).

**Alternative**: Return only a `string` userId — not flexible enough; revision records may need the name.

**Rationale**: Routes may need more than just `id` (e.g., `name` for feature_revisions' `changed_by` display). Returning an object is more flexible.

### 3. Type extension is local to the server package

**Choice**: Extend the `FastifyRequest` type in `apps/server/src/types.ts` and define the `RequestUser` interface there.

**Alternative**: Place in `@openepis/types` — this would introduce a Fastify type dependency into the shared package.

**Rationale**: `RequestUser` is a server-internal concept and should not leak into SDK/CLI or other packages.

### 4. Seed logic runs at server startup

**Choice**: Upsert the default user via the storage layer inside the `current-user.ts` plugin, ensuring the user exists on startup. This seed logic can be removed when real auth is introduced in MVP-1.

**Alternative**: Use a separate seed script — adds operational steps that are easy to forget.

**Rationale**: The plugin is self-contained — it works immediately on startup with no extra steps. The seed is a temporary MVP-0 requirement, and placing it alongside the plugin makes it easy to replace as a unit later.

## Risks / Trade-offs

- **[Risk] Default user accidentally deleted** — Seed checks and creates on every startup, so it recovers even if deleted
- **[Risk] Routes missed during MVP-1 replacement** — All routes uniformly use `request.user.id`, so replacing the plugin only requires changing one place
- **[Trade-off] Default user cannot distinguish operators** — Acceptable for MVP-0; naturally resolved when real auth is introduced in MVP-1
