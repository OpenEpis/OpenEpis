## ADDED Requirements

### Requirement: Playwright configuration

The system SHALL have a Playwright config file at the monorepo root (`playwright.config.ts`) that defines test projects for API tests and web UI tests, configures the base URLs, and sets up `webServer` entries for both the Fastify API server and Vite dev server.

#### Scenario: Config defines API and web test projects

- **WHEN** the Playwright config is loaded
- **THEN** it SHALL define at least two test projects: `api` (using `tests/e2e/api/`) and `web` (using `tests/e2e/web/`)

#### Scenario: WebServer auto-start

- **WHEN** running `pnpm test:e2e`
- **THEN** Playwright SHALL start the API server and web dev server automatically using the `webServer` config
- **THEN** Playwright SHALL wait until both servers are ready before running tests

### Requirement: Test database setup

The system SHALL provide a global setup script that prepares a test database before the e2e suite runs. The setup SHALL push the current Drizzle schema to the test database and truncate all tables.

#### Scenario: Clean database before test run

- **WHEN** the e2e test suite starts via global setup
- **THEN** the test database schema SHALL match the current Drizzle schema
- **THEN** all tables SHALL be truncated (empty) before tests begin

#### Scenario: Test environment variable

- **WHEN** e2e tests run
- **THEN** the server SHALL use `DATABASE_URL` pointing to the test database (e.g., `openepis_test`)

### Requirement: API request fixtures

The system SHALL provide Playwright fixtures that expose an authenticated API request context, pre-configured with the server base URL and default headers.

#### Scenario: Fixture provides API client

- **WHEN** a test uses the `api` fixture
- **THEN** it SHALL receive an `APIRequestContext` configured with the server base URL
- **THEN** requests SHALL include appropriate headers (e.g., content-type, auth)

### Requirement: Test data factory fixtures

The system SHALL provide Playwright fixtures for creating common test entities (projects, features with scenarios, repositories) via the REST API.

#### Scenario: Project factory

- **WHEN** a test uses the `testProject` fixture
- **THEN** it SHALL create a project via `POST /api/projects` and return the created project
- **THEN** the project SHALL be cleaned up after the test completes

#### Scenario: Feature factory

- **WHEN** a test uses the `testFeature` fixture
- **THEN** it SHALL create a project and a feature with sample BDD scenarios via the API
- **THEN** both entities SHALL be cleaned up after the test completes

### Requirement: npm scripts

The system SHALL add a `test:e2e` script to the root `package.json` that runs the Playwright test suite.

#### Scenario: Running e2e tests

- **WHEN** a developer runs `pnpm test:e2e`
- **THEN** Playwright SHALL execute all e2e tests
- **THEN** the command SHALL exit with code 0 on success and non-zero on failure
