## MODIFIED Requirements

### Requirement: Agent lifecycle in message endpoint

The message endpoint SHALL create a BDD agent, subscribe to its events, stream SSE to the client, and persist results on completion. The full lifecycle: read DB state -> build `BddAgentOptions` -> create agent -> subscribe -> prompt -> stream -> persist.

The `convert.ts` module SHALL perform lossless block-to-block mapping between `ContentBlock[]` and pi-ai message types. Tool result messages SHALL no longer be dropped.

#### Scenario: Agent creation with full context

- **WHEN** the server handles `POST /api/conversations/:id/messages`
- **THEN** it reads the conversation, project, LLM config, and feature index from the database, constructs `BddAgentOptions` with `messages` containing `ContentBlock[]` content, and calls `createBddAgent()`

#### Scenario: Pi Agent events mapped to SSE

- **WHEN** the agent emits `message_update` events
- **THEN** the server extracts text deltas and writes `text-delta` SSE events to the response stream

#### Scenario: update_bdd tool result captured

- **WHEN** the agent emits `tool_execution_end` for the `update_bdd` tool
- **THEN** the server calls `mergeChanges(conversation.pendingChanges, event.result)` and writes a `bdd-change` SSE event with the accumulated changes

#### Scenario: Agent completion persists all message types

- **WHEN** the agent emits `agent_end`
- **THEN** the server converts all agent messages via `fromPiMessages()` — including user, assistant, and tool_result messages — persists the updated `messages` array and `pending_changes` to the conversation record, sends a `done` SSE event, and closes the stream

### Requirement: convert.ts lossless block-to-block mapping

The `toPiMessages` function SHALL convert `ConversationMessage[]` with `ContentBlock[]` content to pi-ai `AgentMessage[]` using block-to-block mapping. The `fromPiMessages` function SHALL convert pi-ai `AgentMessage[]` back to `ConversationMessage[]` without information loss.

#### Scenario: toPiMessages maps user text content

- **WHEN** a `ConversationMessage` with `role: "user"` and `content: [{ type: "text", text: "hello" }]` is converted
- **THEN** the result SHALL be a pi-ai `UserMessage` with `content: [{ type: "text", text: "hello" }]`

#### Scenario: toPiMessages maps assistant content blocks

- **WHEN** a `ConversationMessage` with `role: "assistant"` and content containing `text`, `thinking`, and `tool_use` blocks is converted
- **THEN** the result SHALL be a pi-ai `AssistantMessage` with corresponding `TextContent`, `ThinkingContent`, and `ToolCall` blocks in the same order

#### Scenario: toPiMessages maps tool_result messages

- **WHEN** a `ConversationMessage` with `role: "tool_result"` is converted
- **THEN** the result SHALL be a pi-ai `ToolResultMessage` with `toolCallId` from the `tool_result` content block's `tool_use_id`, and `content` mapped from the block

#### Scenario: toPiMessages skips system messages

- **WHEN** a `ConversationMessage` with `role: "system"` is in the input
- **THEN** it SHALL be skipped in the output (system messages are handled via systemPrompt)

#### Scenario: fromPiMessages maps assistant text and tool calls

- **WHEN** a pi-ai `AssistantMessage` has content `[{ type: "text", text: "hi" }, { type: "toolCall", id: "tc1", name: "update_bdd", arguments: {...} }]`
- **THEN** the result SHALL be a `ConversationMessage` with `role: "assistant"` and `content: [{ type: "text", text: "hi" }, { type: "tool_use", id: "tc1", name: "update_bdd", arguments: {...} }]`

#### Scenario: fromPiMessages maps thinking blocks

- **WHEN** a pi-ai `AssistantMessage` has a `ThinkingContent` block
- **THEN** the result SHALL include a `{ type: "thinking", thinking: "..." }` content block

#### Scenario: fromPiMessages maps tool result messages

- **WHEN** a pi-ai `ToolResultMessage` is in the input
- **THEN** the result SHALL be a `ConversationMessage` with `role: "tool_result"` and content containing a `{ type: "tool_result" }` block with `tool_use_id`, `content`, and `is_error`

#### Scenario: fromPiMessages maps user messages

- **WHEN** a pi-ai `UserMessage` with string content is in the input
- **THEN** the result SHALL be a `ConversationMessage` with `role: "user"` and `content: [{ type: "text", text: "..." }]`
