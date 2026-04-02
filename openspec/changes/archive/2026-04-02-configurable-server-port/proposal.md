## Why

The server port is hardcoded to `3001` in `apps/server/src/index.ts`. This makes it impossible to run multiple server instances simultaneously — a requirement for e2e tests that need an isolated server on a separate port, and for deployments where port `3001` may already be in use.

## What Changes

- Read server port from `PORT` environment variable with `3001` as the default fallback
- Add `PORT` to `.env.example` documentation
- Update `playwright.config.ts` to derive server URL from `PORT` env var (via `.env.test`)
- Replace all hardcoded `http://localhost:3001` in e2e test files with a shared `BASE_URL` constant derived from `PORT`
- Add `PORT` to `.env.test` so e2e tests can use a dedicated port

## Capabilities

### New Capabilities

- `server-port-config`: Server port is configurable via the `PORT` environment variable, defaulting to `3001` for backward compatibility

### Modified Capabilities

- `e2e-test-infra`: e2e test infrastructure must use configurable port instead of hardcoded `3001`

## Impact

- **Code**: `apps/server/src/index.ts` — replace hardcoded port with env-driven value
- **Config**: `.env.example` — document `PORT` variable
- **Tests**: `playwright.config.ts`, `api-fixture.ts`, `data-fixtures.ts`, `eval.spec.ts`, and all e2e spec files that use `parseSSEStream` with hardcoded URLs
- **Backward compatible**: default remains `3001`, no breaking change
