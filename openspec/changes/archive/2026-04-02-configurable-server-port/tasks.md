## 1. Server Port Configuration

- [x] 1.1 In `apps/server/src/index.ts`, replace hardcoded `port: 3001` with `parseInt(process.env.PORT ?? "3001", 10)`
- [x] 1.2 Add `PORT` variable to `.env.example` with description and default value `3001`

## 2. E2E Test Infrastructure

- [x] 2.1 Add `PORT=3001` to `.env.test`
- [x] 2.2 In `tests/e2e/fixtures/api-fixture.ts`, export a `BASE_URL` constant derived from `process.env.PORT` (default `3001`), and use it in the fixture's `baseURL`
- [x] 2.3 In `tests/e2e/fixtures/data-fixtures.ts`, import and re-export `BASE_URL` from `api-fixture.ts`
- [x] 2.4 Update `playwright.config.ts` to derive `api`/`eval` project `baseURL` and `webServer[0].url` from `PORT` env var

## 3. Replace Hardcoded URLs in E2E Specs

- [x] 3.1 Replace `"http://localhost:3001"` with `BASE_URL` in `tests/e2e/api/conversations.spec.ts`
- [x] 3.2 Replace `"http://localhost:3001"` with `BASE_URL` in `tests/e2e/api/agent-behavior.spec.ts`
- [x] 3.3 Replace `"http://localhost:3001"` with `BASE_URL` in `tests/e2e/api/datadir.spec.ts`
- [x] 3.4 Replace `"http://localhost:3001"` with `BASE_URL` in `tests/e2e/api/mcp.spec.ts`
- [x] 3.5 Replace `"http://localhost:3001"` with `BASE_URL` in `tests/e2e/api/skill-mcp.spec.ts`
- [x] 3.6 Replace `"http://localhost:3001"` with `BASE_URL` in `tests/e2e/api/skills.spec.ts`
- [x] 3.7 Replace `"http://localhost:3001"` with `BASE_URL` in `tests/e2e/api/regression-datadir.spec.ts`
- [x] 3.8 Replace `"http://localhost:3001"` with `BASE_URL` in `tests/e2e/eval/eval.spec.ts`

## 4. Verification

- [x] 4.1 Grep `tests/e2e/` for any remaining `localhost:3001` — expect zero matches
- [x] 4.2 Verify server starts on default port when `PORT` is not set
- [x] 4.3 Run `pnpm test:e2e` and confirm tests pass
