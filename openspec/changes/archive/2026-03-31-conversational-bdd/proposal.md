## Why

OpenEpis's core value proposition is conversational BDD generation — PM chats with AI, and BDD Features/Scenarios emerge from the dialogue. The `@openepis/core` agent engine and data model exist, but there are no API endpoints for conversations and no chat UI. Without the conversation flow, the platform is just a BDD browser. This is the feature that makes OpenEpis useful.

## What Changes

- **Conversation API endpoints**: CRUD for conversations under projects, plus streaming message endpoint (SSE via `@fastify/sse`), apply/discard pending changes.
- **Data model cleanup**: Remove `prd_id` from conversations entirely (BDD is the single source of truth, PRD concept removed). Add `tool_calls` to `ConversationMessage`. Rename `generated_changes` to `pending_changes`.
- **Storage interface updates**: Add `findByProject()` to `IConversationStorage`, remove `findByPrd()`. Update types to match new `ConversationMessage` shape.
- **Server integration with `@openepis/core`**: Wire the BDD agent into the message endpoint — build `AgentInput` from DB, subscribe to Pi Agent events, stream SSE to client via `@fastify/sse`, persist results.
- **BddContextService adapter**: Server-side implementation of `IBddContextService` to bridge `@openepis/core` with `@openepis/storage`.
- **Chat UI**: Two-panel layout (conversation left, BDD preview right) using `@ai-sdk/react`. Streaming text display, BDD change preview panel with apply/discard actions.

**Deferred to later phase**: File upload/attachments, PRD document linking.

## Capabilities

### New Capabilities

- `conversation-api`: REST API for conversation CRUD, streaming message send (SSE via `@fastify/sse`), apply/discard pending BDD changes
- `conversation-ui`: Two-panel chat UI with streaming text, BDD change preview panel, apply/discard actions
- `server-agent-integration`: Server-side wiring that bridges `@openepis/core` agent with HTTP/SSE layer and database persistence

### Modified Capabilities

- (none — existing specs cover CRUD/browsing features that are not changing at requirement level)

## Impact

- **packages/types**: `ConversationMessage` and `Conversation` types updated (remove prd_id, add tool_calls, rename to pending_changes)
- **packages/storage**: `IConversationStorage` interface gains `findByProject()`, loses `findByPrd()`
- **packages/storage-pg**: Conversation schema migration (drop prd_id, rename field), repository implementation update
- **apps/server**: New route files (`conversations.ts`), new service (`BddContextServiceImpl`), `@fastify/sse` dependency, SSE streaming
- **apps/web**: New chat page/components, `@ai-sdk/react` dependency, routing update
- **Dependencies**: `@fastify/sse` added to `@openepis/server`, `@ai-sdk/react` added to `@openepis/web`
- **Database**: Migration required for conversations table changes
