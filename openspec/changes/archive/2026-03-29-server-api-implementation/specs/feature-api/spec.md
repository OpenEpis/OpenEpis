## ADDED Requirements

### Requirement: List features for project

The server SHALL handle `GET /api/projects/:projectId/features` and return `FeatureListResponse`. It SHALL support optional query parameters: `status` (filter by status), `tag` (filter by tag), `search` (full-text search on title/description).
SDK mapping: `client.features.list(projectId, query?: FeatureListQuery)` → `FeatureListResponse`.

#### Scenario: List all features

- **WHEN** client sends `GET /api/projects/:projectId/features`
- **THEN** server returns HTTP 200 with body matching `FeatureListResponse`: `{ "features": [...] }` where each entry includes `id`, `title`, `description`, `status`, `version`, `tags`, `updated_at`, `scenario_count`

#### Scenario: Filter features by status

- **WHEN** client sends `GET /api/projects/:projectId/features?status=active`
- **THEN** server returns HTTP 200 with only features whose `status` is `"active"`

#### Scenario: Filter features by tag

- **WHEN** client sends `GET /api/projects/:projectId/features?tag=auth`
- **THEN** server returns HTTP 200 with only features that include `"auth"` in their `tags` array

#### Scenario: Search features

- **WHEN** client sends `GET /api/projects/:projectId/features?search=login`
- **THEN** server returns HTTP 200 with features whose `title` or `description` contains `"login"`

#### Scenario: Empty feature list

- **WHEN** client sends `GET /api/projects/:projectId/features` for a project with no features
- **THEN** server returns HTTP 200 with `{ "features": [] }`

### Requirement: Get feature detail

The server SHALL handle `GET /api/features/:id` and return `FeatureDetailResponse`, including the feature's scenarios with their steps.
SDK mapping: `client.features.get(id)` → `FeatureDetailResponse`.

#### Scenario: Successful feature retrieval

- **WHEN** client sends `GET /api/features/:id` for an existing feature
- **THEN** server returns HTTP 200 with body matching `FeatureDetailResponse`: feature fields (`id`, `title`, `description`, `status`, `version`, `tags`, `updated_at`) plus `scenarios` array where each scenario has `id`, `title`, `tags`, `steps` (array of `BddStep`)

#### Scenario: Feature not found

- **WHEN** client sends `GET /api/features/:id` for a non-existent ID
- **THEN** server returns HTTP 404 with `ApiError` containing code `"NOT_FOUND"`

### Requirement: Create feature

The server SHALL handle `POST /api/projects/:projectId/features` with body matching `CreateFeatureRequest` and return the created `Feature` entity.
SDK mapping: `client.features.create(projectId, data: CreateFeatureRequest)` → `Feature`.

Note: `project_id` comes from the URL path parameter, NOT from the request body.

#### Scenario: Create feature with scenarios

- **WHEN** client sends `POST /api/projects/:projectId/features` with `{ "title": "Login", "scenarios": [...] }`
- **THEN** server creates the feature with `project_id` from URL, creates each scenario, creates a revision at version 1, and returns HTTP 201 with body matching `Feature` entity

#### Scenario: Create feature without scenarios

- **WHEN** client sends `POST /api/projects/:projectId/features` with `{ "title": "Login" }`
- **THEN** server creates the feature with no scenarios and returns HTTP 201 with body matching `Feature` entity

#### Scenario: Project not found on create

- **WHEN** client sends `POST /api/projects/:projectId/features` for a non-existent project
- **THEN** server returns HTTP 404 with `ApiError` containing code `"NOT_FOUND"`

### Requirement: Update feature

The server SHALL handle `PUT /api/features/:id` with body matching `UpdateFeatureRequest` and return the updated `Feature` entity. It SHALL increment the version and create a revision snapshot.
SDK mapping: `client.features.update(id, data: UpdateFeatureRequest)` → `Feature`.

#### Scenario: Update feature title

- **WHEN** client sends `PUT /api/features/:id` with `{ "title": "New Title" }`
- **THEN** server updates the title, increments version, creates a revision, and returns HTTP 200 with body matching `Feature` entity

#### Scenario: Update feature with scenario changes

- **WHEN** client sends `PUT /api/features/:id` with a `scenarios` array
- **THEN** server replaces all existing scenarios with the new set, increments version, creates a revision, and returns HTTP 200 with body matching `Feature` entity

#### Scenario: Feature not found on update

- **WHEN** client sends `PUT /api/features/:id` for a non-existent ID
- **THEN** server returns HTTP 404 with `ApiError` containing code `"NOT_FOUND"`

### Requirement: List feature revisions

The server SHALL handle `GET /api/features/:id/revisions` and return `FeatureRevisionsResponse`.
SDK mapping: `client.features.revisions(id)` → `FeatureRevisionsResponse`.

#### Scenario: List revisions

- **WHEN** client sends `GET /api/features/:id/revisions` for a feature with 3 revisions
- **THEN** server returns HTTP 200 with body matching `FeatureRevisionsResponse`: `{ "revisions": [...] }` ordered by version descending, each including `version`, `change_summary`, `changed_by` (`{ id, name }`), `created_at`

#### Scenario: Feature not found

- **WHEN** client sends `GET /api/features/:id/revisions` for a non-existent feature
- **THEN** server returns HTTP 404 with `ApiError` containing code `"NOT_FOUND"`

### Requirement: Get specific feature revision

The server SHALL handle `GET /api/features/:id/revisions/:version` and return the snapshot as `FeatureDetailResponse`.
SDK mapping: `client.features.revision(id, version)` → `FeatureDetailResponse`.

#### Scenario: Get revision by version

- **WHEN** client sends `GET /api/features/:id/revisions/2` for a feature with revision version 2
- **THEN** server returns HTTP 200 with body matching `FeatureDetailResponse` reconstructed from the revision snapshot

#### Scenario: Revision not found

- **WHEN** client sends `GET /api/features/:id/revisions/99` for a version that does not exist
- **THEN** server returns HTTP 404 with `ApiError` containing code `"NOT_FOUND"`
