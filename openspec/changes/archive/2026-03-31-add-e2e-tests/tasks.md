## 1. Test Infrastructure Setup

- [x] 1.1 Install `@playwright/test` as a dev dependency at the monorepo root and run `npx playwright install` to get browser binaries
- [x] 1.2 Create `playwright.config.ts` at the root with two test projects (`api` and `web`), `webServer` entries for Fastify (port 3000) and Vite (port 5173), and test output/report config
- [x] 1.3 Create `tests/e2e/` directory structure: `tests/e2e/api/`, `tests/e2e/web/`, `tests/e2e/fixtures/`
- [x] 1.4 Add `.env.test` with `DATABASE_URL` pointing to `openepis_test` database
- [x] 1.5 Create `tests/e2e/global-setup.ts` that pushes Drizzle schema to test DB and truncates all tables
- [x] 1.6 Add `test:e2e` script to root `package.json` (e.g., `playwright test`) and add to Turborepo pipeline if needed

## 2. Test Fixtures

- [x] 2.1 Create `tests/e2e/fixtures/api-fixture.ts` — Playwright fixture providing an authenticated `APIRequestContext` with server base URL
- [x] 2.2 Create `tests/e2e/fixtures/data-fixtures.ts` — Factory fixtures for creating test projects, features with BDD scenarios, and repositories via the API; includes cleanup on teardown

## 3. API E2E Tests

- [x] 3.1 Create `tests/e2e/api/projects.spec.ts` — Tests for project CRUD: create, list, get detail, update, delete, and 404 on non-existent
- [x] 3.2 Create `tests/e2e/api/features.spec.ts` — Tests for feature CRUD: create with scenarios, list with filters (status/tag/search), update with version increment, revision history
- [x] 3.3 Create `tests/e2e/api/repositories.spec.ts` — Tests for repository linking: create, list, delete
- [x] 3.4 Create `tests/e2e/api/tasks.spec.ts` — Tests for async task: init BDD, poll task status
- [x] 3.5 Create `tests/e2e/api/errors.spec.ts` — Tests for error response format: validation errors (400), not found errors (404)

## 4. Web UI E2E Tests

- [x] 4.1 Create `tests/e2e/web/project-list.spec.ts` — Tests for project list page: displays projects, navigate to create
- [x] 4.2 Create `tests/e2e/web/create-project.spec.ts` — Tests for project creation form: submit with valid data, validation on empty name
- [x] 4.3 Create `tests/e2e/web/project-detail.spec.ts` — Tests for project detail page: displays info, navigate to features
- [x] 4.4 Create `tests/e2e/web/features.spec.ts` — Tests for feature browsing: list features, view feature detail with BDD scenarios and steps
- [x] 4.5 Create `tests/e2e/web/navigation.spec.ts` — Tests for breadcrumb navigation and 404 page

## 5. Verification & Cleanup

- [x] 5.1 Run full e2e suite (`pnpm test:e2e`) and verify all tests pass
- [x] 5.2 Verify tests work with `--project=api` and `--project=web` individually
