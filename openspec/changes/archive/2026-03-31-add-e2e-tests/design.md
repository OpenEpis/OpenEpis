## Context

OpenEpis has no automated tests. The system consists of a Fastify REST API (`apps/server`) with 6 route modules (projects, features, repositories, conversations, context, tasks) backed by PostgreSQL via Drizzle ORM, and a React + Vite frontend (`apps/web`) with 10 pages covering project management and BDD feature browsing. The monorepo uses pnpm + Turborepo.

## Goals / Non-Goals

**Goals:**

- Establish a reusable e2e test infrastructure that supports both API-level and browser-level tests
- Cover the core happy-path flows for the REST API (project, feature, repository CRUD)
- Cover the core user journeys in the web UI (navigation, project creation, feature browsing)
- Make tests runnable locally with `pnpm test:e2e` and CI-ready

**Non-Goals:**

- Unit tests or integration tests (separate initiative)
- Testing the conversation/LLM streaming endpoint (requires LLM mocking, deferred)
- Testing authentication flows in depth (current auth is simple `request.user`)
- 100% endpoint coverage - focus on critical paths first

## Decisions

### 1. Playwright as the test framework

**Choice**: Playwright Test  
**Rationale**: Playwright supports both browser testing and API testing (`request` context) in one framework. It has first-class TypeScript support, auto-waiting, and is the industry standard for e2e. No need for separate tools (e.g., Cypress + supertest).  
**Alternatives considered**: Cypress (no native API testing, slower), Vitest + supertest (no browser testing).

### 2. Test location: `tests/e2e/` at monorepo root

**Choice**: Single `tests/e2e/` directory at the repo root  
**Rationale**: E2e tests span both `apps/server` and `apps/web` - they don't belong in either package. A top-level directory keeps them independent and avoids confusing the Turborepo package graph.  
**Alternatives considered**: Separate test packages per app (adds complexity, e2e tests are inherently cross-cutting).

### 3. Test database isolation via dedicated test database

**Choice**: Use a separate `openepis_test` database, reset between test runs  
**Rationale**: Transaction-based isolation is complex with Fastify's connection pooling. A dedicated DB with schema push + truncation before each suite is simpler and reliable.  
**Alternatives considered**: Docker test containers (heavier setup), in-memory SQLite (incompatible with PostgreSQL-specific features).

### 4. Server startup strategy: pre-started servers via `webServer` config

**Choice**: Use Playwright's `webServer` config to start both the API server and Vite dev server before tests  
**Rationale**: Playwright handles startup/teardown and port-readiness checks automatically. No manual process management needed.  
**Alternatives considered**: Manual startup scripts (error-prone), in-process Fastify injection (misses real HTTP behavior).

### 5. Test data setup via API fixtures

**Choice**: Use Playwright fixtures that create test data through the REST API itself  
**Rationale**: Tests exercise the real API for setup, which doubles as validation. No need to import internal modules or write direct DB queries.  
**Alternatives considered**: Direct DB seeding (tighter coupling to schema internals), shared seed files (stale data risk).

## Risks / Trade-offs

- **[Flaky browser tests]** → Mitigate with Playwright's auto-wait, retry config, and starting with stable UI elements only
- **[Test DB management]** → Mitigate with clear setup/teardown in `globalSetup`; document the required `openepis_test` database
- **[Slow CI runs]** → Mitigate by running API tests and web tests in parallel projects; keep initial suite small (~15-20 tests)
- **[Server startup time]** → Mitigate with Playwright `webServer` timeout config; consider `reuseExistingServer` for local dev
