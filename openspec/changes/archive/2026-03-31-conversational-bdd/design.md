## Context

OpenEpis has the `@openepis/core` package fully implemented — a Pi Agent-based BDD generation engine with three-layer context assembly, tool definitions (`get_feature_detail`, `search_features`, `update_bdd`), and change accumulation logic (`mergeChanges`). The data model for conversations, messages, and generated changes exists in `@openepis/types`, the DB schema in `@openepis/storage-pg`, and the storage interface in `@openepis/storage`.

What's missing: no HTTP endpoints to invoke the agent, no SSE streaming from server to client, and no chat UI. The `conversations` table has a `prd_id NOT NULL` column and `generated_changes` field that need cleanup.

The web app has a React+Vite frontend with project/feature browsing pages but no conversation page.

## Goals / Non-Goals

**Goals:**

- Expose conversation lifecycle via REST API (create, list, get, delete, send message, apply/discard changes)
- Stream agent responses to the client via SSE using `@fastify/sse` plugin (`text-delta`, `bdd-change`, `done` events)
- Two-panel chat UI with real-time streaming text and BDD preview
- Wire `@openepis/core`'s `createBddAgent()` into the server's message endpoint
- Remove `prd_id` from conversations — BDD is the single source of truth

**Non-Goals:**

- File upload / attachments (deferred to later phase)
- PRD document linking (removed — BDD is the single truth source)
- WebSocket transport (SSE is sufficient for unidirectional streaming)
- Real-time collaboration (multiple PMs in same conversation)
- Conversation search or filtering beyond project scope
- Custom system prompt editing by users
- Message editing or regeneration

## Decisions

### 1. `@fastify/sse` for streaming

Use Fastify's official SSE plugin instead of raw `reply.raw`. The plugin provides `reply.sse.send()` with support for async generators, automatic SSE formatting, and proper connection lifecycle. The message endpoint will use an async generator that yields events as the Pi Agent produces them.

```typescript
fastify.post("/api/conversations/:id/messages", { sse: true }, async (request, reply) => {
  async function* agentEvents() {
    // ... yield { event: 'text-delta', data: { delta } }
    // ... yield { event: 'bdd-change', data: { changes } }
    // ... yield { event: 'done', data: { message_id } }
  }
  await reply.sse.send(agentEvents());
});
```

**Alternative considered**: Raw `reply.raw.write()` — works but requires manual SSE formatting, header management, and connection cleanup that the plugin handles.

### 2. `@ai-sdk/react` for client-side streaming

Use `@ai-sdk/react` for managing streaming state on the client. If `useChat` doesn't adapt well to our custom SSE event types, fall back to a custom `useConversation` hook using `EventSource` + React state — the UI components are ours regardless.

**Alternative considered**: Custom hook from scratch — viable fallback, but `@ai-sdk/react` gives us loading states and abort handling for free.

### 3. Remove `prd_id` entirely from conversations

Instead of making `prd_id` nullable, remove the column and the `findByPrd()` storage method. Conversations are project-level entities. BDD is the single source of truth — there's no PRD-to-conversation link needed. The `prd_documents` table and related interfaces remain for any future use but are decoupled from conversations.

### 4. BddContextService as a thin adapter

`BddContextServiceImpl` wraps `IStorageService` to satisfy `IBddContextService` from `@openepis/core`. Instantiated directly in the route handler rather than registered in the DI container — it's only used in the message endpoint and has no lifecycle concerns.

### 5. Database migration

A Drizzle migration will:

- Drop `prd_id` column from `conversations`
- Rename `generated_changes` to `pending_changes`
- Add index on `project_id` (for `findByProject()`)
- Drop the existing index on `prd_id`

### 6. Pending changes state machine

`pending_changes` on the conversation record represents uncommitted BDD proposals:

- `null` → agent calls `update_bdd` → `pending_changes` populated (via `mergeChanges`)
- Subsequent agent turns → `mergeChanges` accumulates
- PM clicks "Apply" → `POST /api/conversations/:id/apply` → writes Features/Scenarios to DB, clears `pending_changes`
- PM clicks "Discard" → `POST /api/conversations/:id/discard` → clears `pending_changes`

Apply logic is transactional: all changes written in a single DB transaction.

## Risks / Trade-offs

- **SSE connection limits**: Browsers limit ~6 concurrent SSE connections per domain. Not a problem for MVP (short-lived per-turn streams). → Mitigation: HTTP/2 if needed later.

- **Agent timeout**: Pi Agent loop could run many steps. → Mitigation: `maxSteps` defaults to 10. Server enforces request timeout (60s). Client shows abort button.

- **Message persistence race**: Server crash mid-stream loses messages. → Mitigation: acceptable for MVP. Future: persist user message on receive, assistant on `agent_end`.

- **`@ai-sdk/react` compatibility**: Our SSE protocol differs from Vercel AI SDK's default format. → Mitigation: fall back to custom `useConversation` hook with `EventSource` if needed.
