## MODIFIED Requirements

### Requirement: Conversation API CRUD e2e tests

The test suite SHALL verify conversation creation, listing, detail retrieval, and deletion through the REST API. Message assertions SHALL use the `ContentBlock[]` shape for the `content` field.

#### Scenario: Create conversation under a project

- **WHEN** a `POST /api/projects/:projectId/conversations` request is sent with `{}`
- **THEN** the response SHALL be 201 with a conversation object containing `id`, `project_id`, `status: "active"`, empty `messages` array, null `pending_changes`, and `created_at`/`updated_at` timestamps

#### Scenario: Get conversation detail

- **WHEN** `GET /api/conversations/:id` is called for an existing conversation
- **THEN** the response SHALL include the full conversation with `messages` array where each message has `content` as a `ContentBlock[]` array (not a string) and `pending_changes` object

### Requirement: SSE message streaming e2e tests

The test suite SHALL verify that sending a message to a conversation returns a valid SSE stream with the expected event types. Message persistence assertions SHALL verify `content` is `ContentBlock[]`.

#### Scenario: Messages are persisted with ContentBlock content after streaming completes

- **WHEN** a message is sent and the SSE stream completes with a `done` event
- **THEN** `GET /api/conversations/:id` SHALL show updated `messages` array where user messages have `content` as an array containing `{ type: "text", text: "..." }` and assistant messages have `content` as an array of content blocks

#### Scenario: Persisted user message content is ContentBlock array

- **WHEN** a message `{ "content": "Say hello" }` is sent and the stream completes
- **THEN** the persisted user message SHALL have `content: [{ type: "text", text: "Say hello" }]` (not `content: "Say hello"`)

#### Scenario: Send message and receive SSE stream

- **WHEN** a `POST /api/conversations/:id/messages` request is sent with `{ "content": "Say hello in one sentence." }`
- **THEN** the response Content-Type SHALL be `text/event-stream`
- **THEN** the stream SHALL contain at least one `text-delta` event with `{ "delta": "<text>" }`
- **THEN** the stream SHALL end with a `done` event with `{ "message_id": "<id>" }`

#### Scenario: Multi-turn conversation preserves ContentBlock message ordering

- **WHEN** two messages are sent in sequence and both streams complete
- **THEN** `GET /api/conversations/:id` SHALL return messages where each message's `content` is a `ContentBlock[]` array, user messages contain `{ type: "text" }` blocks, and assistant messages may contain `text`, `tool_use`, and `thinking` blocks
