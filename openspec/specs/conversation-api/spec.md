## ADDED Requirements

### Requirement: Create conversation

The system SHALL allow creating a conversation under a project. A conversation is created with status `active` and empty messages.

#### Scenario: Create conversation

- **WHEN** client sends `POST /api/projects/:projectId/conversations` with `{}`
- **THEN** system creates a conversation with `project_id` set, `status` "active", empty `messages`, null `pending_changes`, and returns the conversation with HTTP 201

#### Scenario: Create conversation with invalid project

- **WHEN** client sends `POST /api/projects/:projectId/conversations` with a non-existent project ID
- **THEN** system returns HTTP 404 with error code `PROJECT_NOT_FOUND`

### Requirement: List conversations by project

The system SHALL return all conversations belonging to a project, ordered by most recently updated first.

#### Scenario: List conversations for a project

- **WHEN** client sends `GET /api/projects/:projectId/conversations`
- **THEN** system returns an array of conversations for that project, each including `id`, `status`, `created_at`, `updated_at`, and message count (not full messages)

#### Scenario: List conversations for empty project

- **WHEN** client sends `GET /api/projects/:projectId/conversations` for a project with no conversations
- **THEN** system returns an empty array with HTTP 200

### Requirement: Get conversation detail

The system SHALL return a single conversation with its full messages and pending changes.

#### Scenario: Get existing conversation

- **WHEN** client sends `GET /api/conversations/:id`
- **THEN** system returns the conversation including `messages` array and `pending_changes` object

#### Scenario: Get non-existent conversation

- **WHEN** client sends `GET /api/conversations/:id` with a non-existent ID
- **THEN** system returns HTTP 404 with error code `CONVERSATION_NOT_FOUND`

### Requirement: Delete conversation

The system SHALL allow deleting a conversation and all its data.

#### Scenario: Delete existing conversation

- **WHEN** client sends `DELETE /api/conversations/:id`
- **THEN** system deletes the conversation and returns HTTP 204

### Requirement: Send message with streaming response

The system SHALL accept a user message, invoke the BDD agent, and stream the response back via SSE using `@fastify/sse`. The response stream SHALL contain `text-delta`, `bdd-change`, and `done` event types.

The `POST /api/conversations/:id/messages` request body SHALL accept `content` as either a `string` (convenience — server wraps as `[{ type: "text", text }]`) or a `ContentBlock[]`.

#### Scenario: Send message with string content

- **WHEN** client sends `POST /api/conversations/:id/messages` with `{ "content": "hello" }`
- **THEN** system wraps the string as `[{ type: "text", text: "hello" }]` and proceeds with agent invocation

#### Scenario: Send message with ContentBlock array content

- **WHEN** client sends `POST /api/conversations/:id/messages` with `{ "content": [{ "type": "text", "text": "hello" }] }`
- **THEN** system uses the content blocks directly and proceeds with agent invocation

#### Scenario: Send message and receive streaming text

- **WHEN** client sends `POST /api/conversations/:id/messages` with `{ "content": "do something" }`
- **THEN** system returns `Content-Type: text/event-stream` and streams SSE events where `text-delta` events contain `{ "delta": "<text>" }` representing incremental AI response text

#### Scenario: Send message that triggers BDD generation

- **WHEN** client sends a message and the AI agent decides to call `update_bdd`
- **THEN** system streams a `bdd-change` event with `{ "changes": <GeneratedChanges> }` and the conversation's `pending_changes` field is updated via `mergeChanges()`

#### Scenario: Stream completion

- **WHEN** the AI agent finishes processing
- **THEN** system streams a `done` event with `{ "message_id": "<id>" }`, persists all messages (including tool_result messages) and updated `pending_changes` to the database, and closes the SSE connection

#### Scenario: Send message to non-active conversation

- **WHEN** client sends a message to a conversation with status "completed" or "cancelled"
- **THEN** system returns HTTP 400 with error code `CONVERSATION_NOT_ACTIVE`

### Requirement: Apply pending changes

The system SHALL apply all pending BDD changes to the database when requested. This creates new Features/Scenarios and updates existing ones in a single transaction.

#### Scenario: Apply changes with new features

- **WHEN** client sends `POST /api/conversations/:id/apply` and `pending_changes` contains `new_features`
- **THEN** system creates Feature records and their Scenarios in the database, creates FeatureRevision records, clears `pending_changes` to null, and returns `{ "applied_features": [...] }`

#### Scenario: Apply changes with modified features

- **WHEN** client sends `POST /api/conversations/:id/apply` and `pending_changes` contains `modified_features`
- **THEN** system updates the specified Features (title, description, scenarios), creates FeatureRevision records, clears `pending_changes` to null

#### Scenario: Apply with no pending changes

- **WHEN** client sends `POST /api/conversations/:id/apply` and `pending_changes` is null
- **THEN** system returns HTTP 400 with error code `NO_PENDING_CHANGES`

### Requirement: Discard pending changes

The system SHALL clear pending changes without writing them to the database.

#### Scenario: Discard pending changes

- **WHEN** client sends `POST /api/conversations/:id/discard`
- **THEN** system sets `pending_changes` to null on the conversation and returns HTTP 200

### Requirement: Conversation data model removes prd_id

The `conversations` table SHALL have the `prd_id` column removed entirely. The `generated_changes` column SHALL be renamed to `pending_changes`. An index on `project_id` SHALL be added.

#### Scenario: Migration drops prd_id and renames field

- **WHEN** the migration runs
- **THEN** the `prd_id` column is dropped, `generated_changes` is renamed to `pending_changes`, and an index on `project_id` is created

### Requirement: ConversationMessage supports tool_calls

The `ConversationMessage` type SHALL use `content: ContentBlock[]` instead of `content: string`. The `tool_calls` field SHALL be removed. Tool calls SHALL be represented as `{ type: "tool_use" }` content blocks within the `content` array. A new `role: "tool_result"` SHALL be supported to represent tool result messages.

`ContentBlock` SHALL be a discriminated union type in `@openepis/types`:

- `{ type: "text"; text: string }`
- `{ type: "image"; data: string; mimeType: string }`
- `{ type: "tool_use"; id: string; name: string; arguments: Record<string, unknown> }`
- `{ type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean }`
- `{ type: "thinking"; thinking: string }`

#### Scenario: Message with tool_use blocks stored correctly

- **WHEN** an assistant message with tool_use content blocks is persisted to the conversation
- **THEN** the `messages` JSONB array contains the content blocks with `type: "tool_use"` including `id`, `name`, and `arguments` fields

#### Scenario: Tool result messages stored correctly

- **WHEN** a tool_result message is persisted to the conversation
- **THEN** the `messages` JSONB array contains a message with `role: "tool_result"` and content blocks including `{ type: "tool_result" }` with `tool_use_id`, `content`, and optional `is_error`

#### Scenario: Text-only message uses ContentBlock array

- **WHEN** a user or assistant text message is persisted
- **THEN** the `content` field SHALL be `[{ type: "text", text: "..." }]`, not a plain string

### Requirement: Storage interface supports findByProject and removes findByPrd

`IConversationStorage` SHALL include a `findByProject(projectId: string)` method and SHALL remove the `findByPrd()` method.

#### Scenario: Find conversations by project

- **WHEN** `findByProject` is called with a valid project ID
- **THEN** it returns all conversations belonging to that project, ordered by `updated_at` descending
