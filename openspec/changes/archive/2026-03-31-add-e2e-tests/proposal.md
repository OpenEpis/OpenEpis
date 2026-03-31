## Why

The project currently has zero automated tests - no unit tests, integration tests, or e2e tests. As the codebase grows with a full REST API (projects, features, repositories, conversations, tasks, context) and a React web UI, regressions will slip through undetected. E2e tests provide the highest-confidence safety net by exercising real user workflows across both the API and frontend.

## What Changes

- Add **Playwright** as the e2e test framework (browser-based testing for web UI, API testing support)
- Add an **API e2e test suite** covering the core REST API flows: project CRUD, feature CRUD with BDD scenarios, repository linking, and revision history
- Add a **Web UI e2e test suite** covering key user journeys: project creation, feature browsing, BDD scenario viewing, and navigation
- Add test infrastructure: config, helpers, test database seeding, and CI-ready scripts
- Add `pnpm test:e2e` script to root and turborepo pipeline

## Capabilities

### New Capabilities

- `e2e-test-infra`: Test framework setup (Playwright config, helpers, fixtures, database seeding, CI scripts)
- `e2e-api-tests`: API-level e2e tests covering project, feature, repository, and task endpoints
- `e2e-web-tests`: Browser-based e2e tests covering core web UI user journeys

### Modified Capabilities

_None - this change adds test infrastructure without modifying existing behavior._

## Impact

- **New dev dependencies**: `@playwright/test` at monorepo root or in a dedicated `tests/` directory
- **Database**: Tests need a separate test database or transaction-based isolation
- **CI/CD**: New test step in pipeline; Playwright requires browser binaries
- **Dev workflow**: Developers run `pnpm test:e2e` to validate changes; requires running server + web
