## ADDED Requirements

### Requirement: SDK client instantiation

The `@openepis/sdk` package SHALL export an `OpenEpisClient` class that accepts a configuration object with `baseUrl` (string, required) and `fetch` (optional, for testing/custom runtimes).

#### Scenario: Create client with base URL

- **WHEN** a consumer creates `new OpenEpisClient({ baseUrl: "http://localhost:3000" })`
- **THEN** all subsequent API calls SHALL use that base URL

#### Scenario: Custom fetch for testing

- **WHEN** a consumer provides a custom `fetch` function
- **THEN** the SDK SHALL use that function instead of the global `fetch`

### Requirement: Project operations

The client SHALL expose `client.projects` with methods: `list()`, `get(id)`, `create(data)`, `update(id, data)`, `delete(id)`.

#### Scenario: List projects

- **WHEN** `client.projects.list()` is called
- **THEN** it SHALL send `GET /api/projects` and return `ProjectListResponse`

#### Scenario: Create project

- **WHEN** `client.projects.create(data)` is called with `CreateProjectRequest`
- **THEN** it SHALL send `POST /api/projects` with the request body and return the created `Project`

### Requirement: Repository operations

The client SHALL expose `client.repositories` with methods: `list(projectId)`, `create(projectId, data)`, `delete(id)`.

#### Scenario: List repositories for project

- **WHEN** `client.repositories.list(projectId)` is called
- **THEN** it SHALL send `GET /api/projects/:projectId/repositories`

### Requirement: Feature operations

The client SHALL expose `client.features` with methods: `list(projectId, query?)`, `get(id)`, `create(projectId, data)`, `update(id, data)`, `revisions(id)`, `revision(id, version)`.

#### Scenario: List features with filters

- **WHEN** `client.features.list(projectId, { status: "active", tag: "auth" })` is called
- **THEN** it SHALL send `GET /api/projects/:projectId/features?status=active&tag=auth`

#### Scenario: Get feature with scenarios

- **WHEN** `client.features.get(id)` is called
- **THEN** it SHALL send `GET /api/features/:id` and return `FeatureDetailResponse`

### Requirement: Context query

The client SHALL expose `client.context.query(projectId, data)` for file-to-BDD mapping.

#### Scenario: Query context for a file

- **WHEN** `client.context.query(projectId, { file_path: "src/pages/Product.tsx", repository: "frontend" })` is called
- **THEN** it SHALL send `POST /api/projects/:projectId/context` and return `ContextResponse`

### Requirement: Async task status

The client SHALL expose `client.tasks.get(id)` for checking async task progress.

#### Scenario: Check task status

- **WHEN** `client.tasks.get(taskId)` is called
- **THEN** it SHALL send `GET /api/tasks/:id` and return `TaskStatusResponse`

### Requirement: BDD initialization trigger

The client SHALL expose `client.init.trigger(projectId, data?)` for starting BDD initialization.

#### Scenario: Trigger initialization

- **WHEN** `client.init.trigger(projectId, { repository_ids: ["id1"] })` is called
- **THEN** it SHALL send `POST /api/projects/:projectId/init` and return `AsyncTaskResponse`

### Requirement: Error handling

The SDK SHALL throw a typed `OpenEpisApiError` (extending `Error`) on non-2xx responses. The error SHALL include `status` (HTTP status code), `code` (API error code), and `message`.

#### Scenario: Not found error

- **WHEN** the API returns 404 with `{ error: { code: "NOT_FOUND", message: "..." } }`
- **THEN** the SDK SHALL throw `OpenEpisApiError` with `status: 404` and `code: "NOT_FOUND"`

### Requirement: Cross-runtime compatibility

The SDK SHALL work in both browser and Node.js (18+) environments using only the global `fetch` API. It SHALL have no runtime dependencies beyond `@openepis/types`.

#### Scenario: Browser usage

- **WHEN** the SDK is imported in a Vite-bundled React app
- **THEN** it SHALL work without polyfills

#### Scenario: Node.js usage

- **WHEN** the SDK is imported in a Node.js 18+ process
- **THEN** it SHALL work using the built-in `fetch`
