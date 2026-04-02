## ADDED Requirements

### Requirement: Conversation API CRUD e2e tests

The test suite SHALL verify conversation creation, listing, detail retrieval, and deletion through the REST API. Message assertions SHALL use the `ContentBlock[]` shape for the `content` field.

#### Scenario: Create conversation under a project

- **WHEN** a `POST /api/projects/:projectId/conversations` request is sent with `{}`
- **THEN** the response SHALL be 201 with a conversation object containing `id`, `project_id`, `status: "active"`, empty `messages` array, null `pending_changes`, and `created_at`/`updated_at` timestamps

#### Scenario: Create conversation with non-existent project

- **WHEN** a `POST /api/projects/:projectId/conversations` request is sent with a non-existent project ID
- **THEN** the response SHALL be 404 with error code `PROJECT_NOT_FOUND`

#### Scenario: List conversations for a project

- **WHEN** two conversations are created under a project
- **THEN** `GET /api/projects/:projectId/conversations` SHALL return an array of 2 conversations, each including `id`, `status`, `created_at`, `updated_at`, and `message_count`

#### Scenario: List conversations for project with no conversations

- **WHEN** `GET /api/projects/:projectId/conversations` is called for a project with no conversations
- **THEN** the response SHALL be 200 with an empty `conversations` array

#### Scenario: Get conversation detail

- **WHEN** `GET /api/conversations/:id` is called for an existing conversation
- **THEN** the response SHALL include the full conversation with `messages` array where each message has `content` as a `ContentBlock[]` array (not a string) and `pending_changes` object

#### Scenario: Get non-existent conversation

- **WHEN** `GET /api/conversations/:id` is called with a non-existent UUID
- **THEN** the response SHALL be 404 with error code `CONVERSATION_NOT_FOUND`

#### Scenario: Delete conversation

- **WHEN** `DELETE /api/conversations/:id` is called for an existing conversation
- **THEN** the response SHALL be 204
- **WHEN** a subsequent `GET /api/conversations/:id` is called
- **THEN** the response SHALL be 404

### Requirement: SSE message streaming e2e tests

The test suite SHALL verify that sending a message to a conversation returns a valid SSE stream with the expected event types. Message persistence assertions SHALL verify `content` is `ContentBlock[]`. These tests require a valid LLM configuration.

#### Scenario: Send message and receive SSE stream

- **WHEN** a `POST /api/conversations/:id/messages` request is sent with `{ "content": "为用户登录功能写BDD" }`
- **THEN** the response Content-Type SHALL be `text/event-stream`
- **THEN** the stream SHALL contain at least one `text-delta` event with `{ "delta": "<text>" }`
- **THEN** the stream SHALL end with a `done` event with `{ "message_id": "<id>" }`

#### Scenario: Message generates BDD changes

- **WHEN** a message requesting BDD generation is sent (e.g., "为用户收藏功能写BDD测试场景")
- **THEN** the SSE stream SHALL contain a `bdd-change` event with `{ "changes": { "new_features": [...], "modified_features": [...] } }`
- **THEN** `GET /api/conversations/:id` SHALL show `pending_changes` is not null

#### Scenario: Send message to non-active conversation

- **WHEN** a conversation is deleted and then a message is sent to it
- **THEN** the response SHALL be 404 with error code `CONVERSATION_NOT_FOUND`

#### Scenario: Send empty message

- **WHEN** a `POST /api/conversations/:id/messages` request is sent with `{ "content": "" }` or missing content
- **THEN** the response SHALL be 400 with error code `VALIDATION_ERROR`

#### Scenario: Messages are persisted with ContentBlock content after streaming completes

- **WHEN** a message is sent and the SSE stream completes with a `done` event
- **THEN** `GET /api/conversations/:id` SHALL show updated `messages` array where user messages have `content` as an array containing `{ type: "text", text: "..." }` and assistant messages have `content` as an array of content blocks

#### Scenario: Persisted user message content is ContentBlock array

- **WHEN** a message `{ "content": "Say hello" }` is sent and the stream completes
- **THEN** the persisted user message SHALL have `content: [{ type: "text", text: "Say hello" }]` (not `content: "Say hello"`)

#### Scenario: Multi-turn conversation preserves ContentBlock message ordering

- **WHEN** two messages are sent in sequence and both streams complete
- **THEN** `GET /api/conversations/:id` SHALL return messages where each message's `content` is a `ContentBlock[]` array, user messages contain `{ type: "text" }` blocks, and assistant messages may contain `text`, `tool_use`, and `thinking` blocks

### Requirement: Apply and discard pending changes e2e tests

The test suite SHALL verify the apply and discard flows for conversation pending changes.

#### Scenario: Apply pending changes creates features

- **WHEN** a conversation has `pending_changes` with `new_features`
- **THEN** `POST /api/conversations/:id/apply` SHALL return 200 with `{ "applied_features": [...] }`
- **THEN** `GET /api/conversations/:id` SHALL show `pending_changes` is null
- **THEN** `GET /api/projects/:projectId/features` SHALL include the newly created features with their scenarios

#### Scenario: Apply with no pending changes

- **WHEN** `POST /api/conversations/:id/apply` is called on a conversation with null `pending_changes`
- **THEN** the response SHALL be 400 with error code `NO_PENDING_CHANGES`

#### Scenario: Discard pending changes

- **WHEN** a conversation has `pending_changes`
- **THEN** `POST /api/conversations/:id/discard` SHALL return 200 with `{ "ok": true }`
- **THEN** `GET /api/conversations/:id` SHALL show `pending_changes` is null

### Requirement: LLM config fixture for conversation tests

The test suite SHALL use a fixture that creates a platform-level LLM config from environment variables before tests that require LLM, and cleans up after.

#### Scenario: LLM config fixture creates and cleans up

- **WHEN** a test requires `testLlmConfig` fixture
- **THEN** a platform-level LLM config SHALL be created via `POST /api/llm-configs` using env vars `LLM_CONFIG_PROVIDER`, `LLM_CONFIG_MODEL`, `LLM_CONFIG_API_KEY`, `LLM_CONFIG_BASE_URL`
- **THEN** the config SHALL be deleted via `DELETE /api/llm-configs/:id` after the test completes

#### Scenario: Skip LLM tests when config unavailable

- **WHEN** the required LLM environment variables are not set
- **THEN** tests that depend on LLM SHALL be skipped with a descriptive message
