## Context

OpenEpis is a pnpm + Turborepo monorepo with two apps (`apps/web` React frontend, `apps/server` Fastify backend). The workspace currently only includes `apps/*`. The REST API contract is documented in `docs/api.md` with typed entities in `docs/data-model.md`. Both apps will need to share type definitions and HTTP client logic. A CLI app is also planned for developer-facing BDD access.

## Goals / Non-Goals

**Goals:**

- Establish `packages/types` and `packages/sdk` as shared workspace packages
- Define all API types in one place, consumed by both server and client code
- Provide a typed SDK that any JS/TS consumer (web, CLI, future integrations) can use
- Scaffold `apps/cli` as a terminal entry point using the SDK
- Maintain Turborepo build pipeline correctness (types → sdk → apps)

**Non-Goals:**

- Implementing full API endpoints on the server (that's separate work)
- Building out the CLI UX beyond basic scaffolding and one or two example commands
- Runtime request validation (e.g., Zod schemas) — types are compile-time only for now
- Authentication/authorization in the SDK — MVP has no auth enforcement

## Decisions

### 1. Package structure: `packages/types` separate from `packages/sdk`

**Decision**: Two packages, not one.

**Rationale**: The server needs types but not the HTTP client. Keeping them separate avoids pulling fetch/HTTP dependencies into the server bundle. The SDK depends on types; apps choose which they need.

**Alternative considered**: Single `packages/api` package exporting both types and client. Rejected because the server has no use for an HTTP client pointing at itself.

### 2. SDK uses native `fetch` — no axios/got

**Decision**: The SDK uses the global `fetch` API.

**Rationale**: `fetch` is available in all target runtimes (modern browsers, Node 18+). Zero dependencies keeps the package light. The SDK accepts a `baseUrl` and optional `fetch` override for testing.

**Alternative considered**: `ky` or `ofetch` for nicer ergonomics. Rejected — too early to add dependencies; raw fetch is sufficient for typed wrappers.

### 3. SDK client is a class instantiated with config

**Decision**: `new OpenEpisClient({ baseUrl, fetch? })` pattern.

```typescript
const client = new OpenEpisClient({ baseUrl: "http://localhost:3000" });
const features = await client.features.list(projectId);
```

**Rationale**: A class allows shared config (baseUrl, headers, auth tokens later). Resource-grouped methods (client.projects, client.features) mirror the API structure from `docs/api.md`.

### 4. CLI uses `citty` for command framework

**Decision**: Use `citty` (or a similar minimal CLI framework) for the `apps/cli` app.

**Rationale**: Lightweight, TypeScript-first. The CLI is thin — it calls SDK methods and formats output. No need for heavy frameworks.

**Alternative considered**: `commander`, `yargs`. Both viable but heavier than needed for a thin SDK wrapper.

### 5. Types are plain TypeScript interfaces — no runtime validation yet

**Decision**: `packages/types` exports only TypeScript types/interfaces, no Zod schemas or runtime validators.

**Rationale**: MVP-0 has no auth and minimal validation needs. Adding Zod later is straightforward (derive types from schemas). Starting with plain types avoids premature complexity.

### 6. Build with `tsc` — no bundler for packages

**Decision**: Both packages use `tsc` to emit ESM + declaration files. No esbuild/tsup bundler.

**Rationale**: These are internal workspace packages consumed via Turborepo. Turborepo handles build ordering. Simple `tsc` output is sufficient; consumers (Vite for web, tsx for server/CLI) handle their own bundling.

## Risks / Trade-offs

- **Types drift from server implementation** → Mitigation: Server imports types from `@openepis/types` directly in route handlers, so type mismatches become compile errors.
- **SDK assumes API shape before server is built** → Mitigation: Both SDK and server derive from the same types package and docs. SDK methods can be stubbed initially and filled in as server endpoints are implemented.
- **No runtime validation on API boundaries** → Acceptable for MVP-0. Will revisit with Zod or similar when auth and production hardening are needed.
