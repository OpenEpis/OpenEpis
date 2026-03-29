## ADDED Requirements

### Requirement: List repositories for project

The server SHALL handle `GET /api/projects/:projectId/repositories` and return `RepositoryListResponse`.
SDK mapping: `client.repositories.list(projectId)` → `RepositoryListResponse`.

#### Scenario: List repositories

- **WHEN** client sends `GET /api/projects/:projectId/repositories` for a project with repositories
- **THEN** server returns HTTP 200 with body matching `RepositoryListResponse`: `{ "repositories": [...] }` where each entry is a full `Repository` entity

#### Scenario: Empty repository list

- **WHEN** client sends `GET /api/projects/:projectId/repositories` for a project with no repositories
- **THEN** server returns HTTP 200 with `{ "repositories": [] }`

#### Scenario: Project not found

- **WHEN** client sends `GET /api/projects/:projectId/repositories` for a non-existent project
- **THEN** server returns HTTP 404 with `ApiError` containing code `"NOT_FOUND"`

### Requirement: Create repository

The server SHALL handle `POST /api/projects/:projectId/repositories` with body matching `CreateRepositoryRequest` and return the created `Repository` entity.
SDK mapping: `client.repositories.create(projectId, data: CreateRepositoryRequest)` → `Repository`.

#### Scenario: Successful repository creation

- **WHEN** client sends `POST /api/projects/:projectId/repositories` with `{ "name": "frontend", "git_url": "https://github.com/org/repo.git" }`
- **THEN** server returns HTTP 201 with body matching `Repository` entity (including `id`, `project_id`, `name`, `git_url`, `default_branch` defaulting to `"main"`, `created_at`, `updated_at`)

#### Scenario: Project not found on create

- **WHEN** client sends `POST /api/projects/:projectId/repositories` for a non-existent project
- **THEN** server returns HTTP 404 with `ApiError` containing code `"NOT_FOUND"`

### Requirement: Delete repository

The server SHALL handle `DELETE /api/repositories/:id` and return HTTP 204 with no body.
SDK mapping: `client.repositories.delete(id)` → `void`.

#### Scenario: Successful repository deletion

- **WHEN** client sends `DELETE /api/repositories/:id` for an existing repository
- **THEN** server returns HTTP 204 with no body

#### Scenario: Repository not found on delete

- **WHEN** client sends `DELETE /api/repositories/:id` for a non-existent ID
- **THEN** server returns HTTP 404 with `ApiError` containing code `"NOT_FOUND"`
