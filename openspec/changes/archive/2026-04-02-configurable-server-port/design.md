## Context

The Fastify server in `apps/server/src/index.ts` hardcodes `port: 3001` in the `app.listen()` call. The project already uses `dotenv/config` for environment variables (`DATABASE_URL`, `ENCRYPTION_KEY`), so the infrastructure for env-based configuration is in place.

## Goals / Non-Goals

**Goals:**

- Make the server port configurable via `PORT` environment variable
- Maintain backward compatibility (default to `3001`)
- Allow e2e tests to launch an isolated server instance on a different port

**Non-Goals:**

- Host address configuration (stays `0.0.0.0`)
- Full server config object / config file system
- Dynamic port allocation (port `0` for OS-assigned) — callers can implement this themselves by setting `PORT=0`

## Decisions

**Centralize `BASE_URL` in e2e test fixtures**

All e2e test files currently hardcode `"http://localhost:3001"`. Instead of replacing each instance with `process.env` reads, export a single `BASE_URL` constant from `tests/e2e/fixtures/api-fixture.ts` (or a shared constants file). This constant reads `PORT` from `process.env` (already loaded by `playwright.config.ts` from `.env.test`) and constructs the URL once:

```ts
const port = process.env.PORT ?? "3001";
export const BASE_URL = `http://localhost:${port}`;
```

All spec files and `parseSSEStream` callers import `BASE_URL` from the fixture. The `api` fixture's `baseURL` also uses this constant.

**Playwright config derives URLs from `PORT`**

`playwright.config.ts` reads `PORT` from `.env.test` (already parsed via `dotenv`) and uses it for `webServer[0].url` and the `api`/`eval` project `baseURL` values.

Alternative considered: pass `PORT` only through Playwright config's `baseURL` and extract it in tests. This doesn't work for `parseSSEStream` calls that need a full URL string outside of Playwright's request context.

## Decisions

**Read `PORT` from `process.env` with `parseInt`, default `3001`**

The simplest approach: `const port = parseInt(process.env.PORT ?? "3001", 10)`. No config library needed — this is a single variable already loaded by `dotenv/config`. Parsing with `parseInt` handles the string-to-number conversion. If `PORT` is set to a non-numeric value, the server will fail fast with Fastify's own validation.

Alternative considered: a dedicated config module with schema validation (e.g., `env-schema`). Overkill for a single variable — can be introduced later if more config is needed.

## Risks / Trade-offs

- **[Invalid PORT value]** → Fastify will throw on `listen()` if the port is `NaN` or out of range. This is acceptable fail-fast behavior; no extra validation needed.
- **[Port conflicts in CI]** → e2e tests can now set `PORT` in `.env.test` to avoid conflicts. Default stays `3001` for backward compatibility.
- **[Missed hardcoded URL]** → grep for `localhost:3001` after implementation to catch any remaining instances.
