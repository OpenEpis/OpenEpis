## MODIFIED Requirements

### Requirement: Trigger BDD initialization

The server SHALL handle `POST /api/projects/:projectId/init` with optional body matching `InitBddRequest` and return `AsyncTaskResponse` with HTTP 202. The `created_by` field of the async_task SHALL be set to `request.user.id` (a valid UUID) instead of a string literal.
SDK mapping: `client.init.trigger(projectId, data?: InitBddRequest)` → `AsyncTaskResponse`.

In MVP-0, this creates an async_task record with status `"queued"` but does NOT start the actual pipeline worker.

#### Scenario: Successful init trigger

- **WHEN** client sends `POST /api/projects/:projectId/init` for an existing project
- **THEN** server creates an async_task with type `"init_bdd"`, status `"queued"`, and `created_by` from `request.user.id`, returns HTTP 202 with body matching `AsyncTaskResponse`: `{ "task_id": "...", "status": "queued" }`

#### Scenario: Init with specific repositories

- **WHEN** client sends `POST /api/projects/:projectId/init` with `{ "repository_ids": ["id1", "id2"] }`
- **THEN** server creates an async_task and returns HTTP 202 with `AsyncTaskResponse`

#### Scenario: Project not found on init

- **WHEN** client sends `POST /api/projects/:projectId/init` for a non-existent project
- **THEN** server returns HTTP 404 with `ApiError` containing code `"NOT_FOUND"`
