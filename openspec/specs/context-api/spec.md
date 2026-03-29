## ADDED Requirements

### Requirement: Find BDD context for a file path

The server SHALL handle `POST /api/projects/:projectId/context` with body matching `PostContextRequest` and return `ContextResponse`.
SDK mapping: `client.context.query(projectId, data: PostContextRequest)` → `ContextResponse`.

In MVP-0, this is a stub that returns an empty result. Full implementation requires LLM integration (deferred).

#### Scenario: Context lookup (stub)

- **WHEN** client sends `POST /api/projects/:projectId/context` with `{ "file_path": "src/auth/login.ts", "repository": "backend" }`
- **THEN** server returns HTTP 200 with body matching `ContextResponse`: `{ "related_features": [] }`

#### Scenario: Project not found on context lookup

- **WHEN** client sends `POST /api/projects/:projectId/context` for a non-existent project
- **THEN** server returns HTTP 404 with `ApiError` containing code `"NOT_FOUND"`
