## MODIFIED Requirements

### Requirement: Create project

The server SHALL handle `POST /api/projects` with body matching `CreateProjectRequest` and return the created `Project` entity. The `created_by` field SHALL be set to `request.user.id` instead of a hardcoded value.
SDK mapping: `client.projects.create(data: CreateProjectRequest)` → `Project`.

#### Scenario: Successful project creation

- **WHEN** client sends `POST /api/projects` with `{ "name": "My Project", "description": "desc" }`
- **THEN** server returns HTTP 201 with body matching `Project` entity (including `id`, `name`, `description`, `created_by`, `created_at`, `updated_at`)
- **AND** `created_by` SHALL equal `request.user.id`

#### Scenario: Create project without description

- **WHEN** client sends `POST /api/projects` with `{ "name": "My Project" }`
- **THEN** server returns HTTP 201 with `description` set to `null`

#### Scenario: Missing required name

- **WHEN** client sends `POST /api/projects` with `{}`
- **THEN** server returns HTTP 400 with `ApiError` containing code `"VALIDATION_ERROR"`
