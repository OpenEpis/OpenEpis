## MODIFIED Requirements

### Requirement: Playwright configuration

The system SHALL have a Playwright config file at the monorepo root (`playwright.config.ts`) that defines test projects for API tests and web UI tests, configures the base URLs derived from the `PORT` environment variable, and sets up `webServer` entries for both the Fastify API server and Vite dev server.

#### Scenario: Config defines API and web test projects

- **WHEN** the Playwright config is loaded
- **THEN** it SHALL define at least two test projects: `api` (using `tests/e2e/api/`) and `web` (using `tests/e2e/web/`)

#### Scenario: WebServer auto-start

- **WHEN** running `pnpm test:e2e`
- **THEN** Playwright SHALL start the API server and web dev server automatically using the `webServer` config
- **THEN** Playwright SHALL wait until both servers are ready before running tests

#### Scenario: Server URL derived from PORT

- **WHEN** `PORT` is set in `.env.test` (e.g., `PORT=3099`)
- **THEN** the Playwright `webServer` health check URL SHALL use that port
- **THEN** the `api` and `eval` project `baseURL` values SHALL use that port

#### Scenario: Default port when PORT is not set in .env.test

- **WHEN** `PORT` is not set in `.env.test`
- **THEN** the Playwright config SHALL default to port `3001` for the API server

### Requirement: API request fixtures

The system SHALL provide Playwright fixtures that expose an authenticated API request context, pre-configured with the server base URL derived from `PORT` and default headers.

#### Scenario: Fixture provides API client

- **WHEN** a test uses the `api` fixture
- **THEN** it SHALL receive an `APIRequestContext` configured with the server base URL derived from `PORT`
- **THEN** requests SHALL include appropriate headers (e.g., content-type, auth)

## ADDED Requirements

### Requirement: Shared BASE_URL constant for e2e tests

The e2e test fixtures SHALL export a `BASE_URL` constant derived from `process.env.PORT` (defaulting to `3001`). All e2e test files that need the server URL (e.g., for `parseSSEStream` calls or direct `fetch`) SHALL use this constant instead of hardcoded `"http://localhost:3001"`.

#### Scenario: BASE_URL reflects PORT

- **WHEN** `PORT` is set to `4000` in the environment
- **THEN** `BASE_URL` SHALL equal `"http://localhost:4000"`

#### Scenario: BASE_URL defaults to 3001

- **WHEN** `PORT` is not set
- **THEN** `BASE_URL` SHALL equal `"http://localhost:3001"`

#### Scenario: No hardcoded port in e2e test files

- **WHEN** searching all files under `tests/e2e/` for `localhost:3001`
- **THEN** no matches SHALL be found (all replaced by `BASE_URL`)
