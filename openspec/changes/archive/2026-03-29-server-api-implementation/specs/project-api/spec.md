## ADDED Requirements

### Requirement: List projects

The server SHALL handle `GET /api/projects` and return `ProjectListResponse`.
SDK mapping: `client.projects.list()` → `ProjectListResponse`.

#### Scenario: List projects

- **WHEN** client sends `GET /api/projects`
- **THEN** server returns HTTP 200 with body matching `ProjectListResponse`: `{ "projects": [...] }` where each entry includes `id`, `name`, `created_at`, `feature_count`

#### Scenario: Empty project list

- **WHEN** client sends `GET /api/projects` and no projects exist
- **THEN** server returns HTTP 200 with `{ "projects": [] }`

### Requirement: Get project detail

The server SHALL handle `GET /api/projects/:id` and return `ProjectDetailResponse`.
SDK mapping: `client.projects.get(id)` → `ProjectDetailResponse`.

#### Scenario: Successful project retrieval

- **WHEN** client sends `GET /api/projects/:id` for an existing project
- **THEN** server returns HTTP 200 with body matching `ProjectDetailResponse` (all `Project` fields plus `repo_count` and `feature_count`)

#### Scenario: Project not found

- **WHEN** client sends `GET /api/projects/:id` for a non-existent ID
- **THEN** server returns HTTP 404 with body matching `ApiError`: `{ "error": { "code": "NOT_FOUND", "message": "..." } }`

### Requirement: Create project

The server SHALL handle `POST /api/projects` with body matching `CreateProjectRequest` and return the created `Project` entity.
SDK mapping: `client.projects.create(data: CreateProjectRequest)` → `Project`.

#### Scenario: Successful project creation

- **WHEN** client sends `POST /api/projects` with `{ "name": "My Project", "description": "desc" }`
- **THEN** server returns HTTP 201 with body matching `Project` entity (including `id`, `name`, `description`, `created_by`, `created_at`, `updated_at`)

#### Scenario: Create project without description

- **WHEN** client sends `POST /api/projects` with `{ "name": "My Project" }`
- **THEN** server returns HTTP 201 with `description` set to `null`

#### Scenario: Missing required name

- **WHEN** client sends `POST /api/projects` with `{}`
- **THEN** server returns HTTP 400 with `ApiError` containing code `"VALIDATION_ERROR"`

### Requirement: Update project

The server SHALL handle `PUT /api/projects/:id` with body matching `UpdateProjectRequest` and return the updated `Project` entity.
SDK mapping: `client.projects.update(id, data: UpdateProjectRequest)` → `Project`.

#### Scenario: Successful project update

- **WHEN** client sends `PUT /api/projects/:id` with `{ "name": "New Name" }` for an existing project
- **THEN** server returns HTTP 200 with body matching `Project` entity with the updated fields

#### Scenario: Project not found on update

- **WHEN** client sends `PUT /api/projects/:id` for a non-existent ID
- **THEN** server returns HTTP 404 with `ApiError` containing code `"NOT_FOUND"`

### Requirement: Delete project

The server SHALL handle `DELETE /api/projects/:id` and return HTTP 204 with no body.
SDK mapping: `client.projects.delete(id)` → `void`.

#### Scenario: Successful project deletion

- **WHEN** client sends `DELETE /api/projects/:id` for an existing project
- **THEN** server returns HTTP 204 with no body

#### Scenario: Project not found on delete

- **WHEN** client sends `DELETE /api/projects/:id` for a non-existent ID
- **THEN** server returns HTTP 404 with `ApiError` containing code `"NOT_FOUND"`
