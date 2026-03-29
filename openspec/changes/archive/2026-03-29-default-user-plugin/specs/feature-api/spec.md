## MODIFIED Requirements

### Requirement: Create feature

The server SHALL handle `POST /api/projects/:projectId/features` with body matching `CreateFeatureRequest` and return the created `Feature` entity. The `created_by` field SHALL be set to `request.user.id`. The initial revision's `changed_by` SHALL also be set to `request.user.id`.
SDK mapping: `client.features.create(projectId, data: CreateFeatureRequest)` → `Feature`.

Note: `project_id` comes from the URL path parameter, NOT from the request body.

#### Scenario: Create feature with scenarios

- **WHEN** client sends `POST /api/projects/:projectId/features` with `{ "title": "Login", "scenarios": [...] }`
- **THEN** server creates the feature with `project_id` from URL, `created_by` from `request.user.id`, creates each scenario, creates a revision at version 1 with `changed_by` from `request.user.id`, and returns HTTP 201 with body matching `Feature` entity

#### Scenario: Create feature without scenarios

- **WHEN** client sends `POST /api/projects/:projectId/features` with `{ "title": "Login" }`
- **THEN** server creates the feature with no scenarios and returns HTTP 201 with body matching `Feature` entity

#### Scenario: Project not found on create

- **WHEN** client sends `POST /api/projects/:projectId/features` for a non-existent project
- **THEN** server returns HTTP 404 with `ApiError` containing code `"NOT_FOUND"`

### Requirement: Update feature

The server SHALL handle `PUT /api/features/:id` with body matching `UpdateFeatureRequest` and return the updated `Feature` entity. It SHALL increment the version and create a revision snapshot with `changed_by` set to `request.user.id`.
SDK mapping: `client.features.update(id, data: UpdateFeatureRequest)` → `Feature`.

#### Scenario: Update feature title

- **WHEN** client sends `PUT /api/features/:id` with `{ "title": "New Title" }`
- **THEN** server updates the title, increments version, creates a revision with `changed_by` from `request.user.id`, and returns HTTP 200 with body matching `Feature` entity

#### Scenario: Update feature with scenario changes

- **WHEN** client sends `PUT /api/features/:id` with a `scenarios` array
- **THEN** server replaces all existing scenarios with the new set, increments version, creates a revision with `changed_by` from `request.user.id`, and returns HTTP 200 with body matching `Feature` entity

#### Scenario: Feature not found on update

- **WHEN** client sends `PUT /api/features/:id` for a non-existent ID
- **THEN** server returns HTTP 404 with `ApiError` containing code `"NOT_FOUND"`
