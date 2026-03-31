## ADDED Requirements

### Requirement: Project CRUD e2e tests

The system SHALL have e2e tests that verify project creation, listing, detail retrieval, update, and deletion through the REST API.

#### Scenario: Create and list projects

- **WHEN** a `POST /api/projects` request is sent with `{ name, description }`
- **THEN** the response SHALL be 201 with the created project including `id`, `name`, `created_at`
- **WHEN** a `GET /api/projects` request is sent
- **THEN** the response SHALL include the created project in the list

#### Scenario: Get project detail

- **WHEN** a `GET /api/projects/:id` request is sent for an existing project
- **THEN** the response SHALL include `id`, `name`, `description`, `repo_count`, `feature_count`

#### Scenario: Update project

- **WHEN** a `PUT /api/projects/:id` request is sent with updated fields
- **THEN** the response SHALL reflect the updated values

#### Scenario: Delete project

- **WHEN** a `DELETE /api/projects/:id` request is sent
- **THEN** the response SHALL be 204
- **WHEN** a subsequent `GET /api/projects/:id` request is sent
- **THEN** the response SHALL be 404

#### Scenario: Get non-existent project

- **WHEN** a `GET /api/projects/:id` request is sent with a non-existent UUID
- **THEN** the response SHALL be 404 with error code `NOT_FOUND`

### Requirement: Feature CRUD e2e tests

The system SHALL have e2e tests that verify feature creation with BDD scenarios, listing with filters, detail retrieval, update with versioning, and deletion.

#### Scenario: Create feature with scenarios

- **WHEN** a `POST /api/projects/:id/features` request is sent with title, description, and scenarios (each having title and steps)
- **THEN** the response SHALL be 201 with the created feature
- **WHEN** a `GET /api/features/:id` request is sent
- **THEN** the response SHALL include the feature with its scenarios and steps

#### Scenario: List features with filters

- **WHEN** features are created with different statuses and tags
- **THEN** `GET /api/projects/:id/features?status=draft` SHALL return only draft features
- **THEN** `GET /api/projects/:id/features?tag=auth` SHALL return only features tagged with `auth`
- **THEN** `GET /api/projects/:id/features?search=login` SHALL return only features matching the search

#### Scenario: Update feature creates new version

- **WHEN** a `PUT /api/features/:id` request is sent with updated title and scenarios
- **THEN** the feature version SHALL increment
- **THEN** a new revision SHALL be created in `GET /api/features/:id/revisions`

#### Scenario: Feature revision history

- **WHEN** a feature is created and then updated twice
- **THEN** `GET /api/features/:id/revisions` SHALL return 3 revisions (versions 1, 2, 3)
- **WHEN** `GET /api/features/:id/revisions/:version` is called for version 1
- **THEN** it SHALL return the original feature snapshot

### Requirement: Repository e2e tests

The system SHALL have e2e tests that verify repository linking to projects and removal.

#### Scenario: Link and list repositories

- **WHEN** a `POST /api/projects/:id/repositories` request is sent with `{ name, git_url }`
- **THEN** the response SHALL be 201 with the repository
- **WHEN** `GET /api/projects/:id/repositories` is called
- **THEN** the linked repository SHALL appear in the list

#### Scenario: Delete repository

- **WHEN** a `DELETE /api/repositories/:id` request is sent
- **THEN** the response SHALL be 204

### Requirement: Task status e2e tests

The system SHALL have e2e tests that verify async task creation and status polling.

#### Scenario: Init BDD task

- **WHEN** a `POST /api/projects/:id/init` request is sent
- **THEN** the response SHALL be 202 with a `task_id`
- **WHEN** `GET /api/tasks/:id` is called with the returned task_id
- **THEN** the response SHALL include `id`, `type`, `status`, `progress`

### Requirement: Error response format e2e tests

The system SHALL have e2e tests that verify error responses follow the standard format.

#### Scenario: Validation error format

- **WHEN** a `POST /api/projects` request is sent with empty body (missing required `name`)
- **THEN** the response SHALL be 400
- **THEN** the response body SHALL match `{ error: { code: "VALIDATION_ERROR", message: string } }`

#### Scenario: Not found error format

- **WHEN** a request is made to a resource that doesn't exist
- **THEN** the response SHALL be 404
- **THEN** the response body SHALL match `{ error: { code: "NOT_FOUND", message: string } }`
