## ADDED Requirements

### Requirement: Shared entity types

The `@openepis/types` package SHALL export TypeScript interfaces for all database entities: `Project`, `User`, `ProjectMember`, `Repository`, `Feature`, `Scenario`, `FeatureRevision`, `PrdDocument`, `Conversation`, `AsyncTask`, and `LlmConfig`.

#### Scenario: Server imports entity types

- **WHEN** the server defines a route handler for `GET /api/projects`
- **THEN** it can import `Project` from `@openepis/types` and use it to type the response

#### Scenario: Web app imports entity types

- **WHEN** the web app renders a project list
- **THEN** it can import `Project` from `@openepis/types` to type the data

### Requirement: API request types

The package SHALL export request body types for all write endpoints: `CreateProjectRequest`, `UpdateProjectRequest`, `CreateRepositoryRequest`, `CreateFeatureRequest`, `UpdateFeatureRequest`, `InitBddRequest`, and `PostContextRequest`.

#### Scenario: SDK uses request types

- **WHEN** the SDK calls `POST /api/projects`
- **THEN** the method parameter SHALL be typed as `CreateProjectRequest`

### Requirement: API response types

The package SHALL export response types for all endpoints: `ProjectListResponse`, `ProjectDetailResponse`, `FeatureListResponse`, `FeatureDetailResponse`, `FeatureRevisionsResponse`, `ContextResponse`, `TaskStatusResponse`, and `AsyncTaskResponse`.

#### Scenario: SDK returns typed responses

- **WHEN** the SDK calls `GET /api/projects/:id/features`
- **THEN** the return type SHALL be `FeatureListResponse`

### Requirement: API error format type

The package SHALL export an `ApiError` type matching the documented error format: `{ error: { code: string; message: string } }`.

#### Scenario: SDK handles error responses

- **WHEN** the server returns a non-2xx response
- **THEN** the error body SHALL match the `ApiError` type

### Requirement: BDD step type

The package SHALL export a `BddStep` type with `type` field (`'given' | 'and' | 'when' | 'then'`) and `text` field (string), matching the scenarios JSONB structure.

#### Scenario: Step type used in Scenario

- **WHEN** a `Scenario` entity includes steps
- **THEN** the `steps` field SHALL be typed as `BddStep[]`

### Requirement: Package build output

The package SHALL emit ESM JavaScript with TypeScript declaration files (`.d.ts`). It SHALL have no runtime dependencies.

#### Scenario: Types-only package

- **WHEN** a consumer installs `@openepis/types`
- **THEN** no runtime JavaScript beyond type re-exports SHALL be included
