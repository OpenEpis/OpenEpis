## MODIFIED Requirements

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
