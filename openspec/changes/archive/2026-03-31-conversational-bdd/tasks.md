## 1. Data Model & Type Updates

- [x] 1.1 Update `ConversationMessage` in `packages/types/src/entities.ts`: add optional `tool_calls` (array of `{ name: string, arguments: Record<string, unknown> }`)
- [x] 1.2 Update `Conversation` in `packages/types/src/entities.ts`: remove `prd_id` field, rename `generated_changes` to `pending_changes`
- [x] 1.3 Update `packages/storage-pg/src/schema/conversations.ts`: drop `prd_id` column and its FK/index, rename `generated_changes` to `pending_changes`, add index on `project_id`
- [x] 1.4 Generate and run Drizzle migration (`pnpm db:pg:generate` + `pnpm db:pg:migrate`)

## 2. Storage Interface & Implementation

- [x] 2.1 Replace `findByPrd()` with `findByProject(projectId: string): Promise<Conversation[]>` in `IConversationStorage` (`packages/storage/src/interfaces/conversation-storage.ts`)
- [x] 2.2 Implement `findByProject` in `packages/storage-pg` conversation repository, ordered by `updated_at` DESC
- [x] 2.3 Update any existing conversation repository code that references `generated_changes` to use `pending_changes`

## 3. Server — Conversation API Routes

- [x] 3.1 Create `apps/server/src/routes/conversations.ts` with Fastify route plugin
- [x] 3.2 Implement `POST /api/projects/:projectId/conversations` — create conversation
- [x] 3.3 Implement `GET /api/projects/:projectId/conversations` — list conversations with message count
- [x] 3.4 Implement `GET /api/conversations/:id` — get conversation with full messages and pending_changes
- [x] 3.5 Implement `DELETE /api/conversations/:id` — delete conversation
- [x] 3.6 Register conversation routes in the Fastify app

## 4. Server — BddContextService Adapter

- [x] 4.1 Create `apps/server/src/services/bdd-context-service.ts` implementing `IBddContextService` from `@openepis/core`
- [x] 4.2 Implement `getFeatureDetail()` — load Feature + Scenarios from storage, map to `FeatureDetail`
- [x] 4.3 Implement `searchFeatures()` — search Features by keyword in project, map to `FeatureSummary[]`

## 5. Server — Streaming Message Endpoint

- [x] 5.1 Add `@fastify/sse` dependency to `apps/server` and register the plugin
- [x] 5.2 Implement `POST /api/conversations/:id/messages` route with `{ sse: true }` — validate conversation is active, parse body
- [x] 5.3 Implement LLM config resolution: read project-level config, fall back to platform-level
- [x] 5.4 Implement feature index assembly: load all Features for project, map to `FeatureSummary[]`
- [x] 5.5 Wire `createBddAgent()` with full `BddAgentOptions` (conversation messages, feature index, model config, context service)
- [x] 5.6 Implement async generator that subscribes to Pi Agent events and yields SSE events: `message_update` → `text-delta`, `tool_execution_end(update_bdd)` → `bdd-change`, `agent_end` → `done`
- [x] 5.7 Implement post-stream persistence: on `agent_end`, persist updated messages and pending_changes to DB
- [x] 5.8 Handle agent errors: catch exceptions, send error SSE event, close stream

## 6. Server — Apply & Discard Endpoints

- [x] 6.1 Implement `POST /api/conversations/:id/apply` — read pending_changes, create Features/Scenarios/Revisions in a transaction, clear pending_changes
- [x] 6.2 Implement `POST /api/conversations/:id/discard` — clear pending_changes

## 7. Frontend — Dependencies & Routing

- [x] 7.1 Add `@ai-sdk/react` dependency to `apps/web` (skipped — using custom useConversationStream hook with fetch/SSE as design doc anticipated)
- [x] 7.2 Add conversation routes to `apps/web/src/router.tsx`: `/projects/:projectId/conversations` (list) and `/conversations/:id` (detail/chat)

## 8. Frontend — Conversation List

- [x] 8.1 Create `apps/web/src/pages/conversation-list.tsx` — fetch and display conversations for a project
- [x] 8.2 Add "New Conversation" button that calls create API and navigates to the new conversation
- [x] 8.3 Link conversation list from the project detail page

## 9. Frontend — Chat UI (Two-Panel Layout)

- [x] 9.1 Create `apps/web/src/pages/conversation-detail.tsx` with two-panel layout (chat left, BDD preview right)
- [x] 9.2 Implement chat message list component — display user and assistant messages with timestamps
- [x] 9.3 Implement message input component with send button and Enter-to-send
- [x] 9.4 Implement streaming hook (`useConversation` or adapted `useChat`) that connects to the SSE message endpoint, handles `text-delta`/`bdd-change`/`done` events
- [x] 9.5 Implement streaming text display — typewriter effect with auto-scroll
- [x] 9.6 Implement loading/abort UI — spinner during streaming, stop button to abort SSE connection

## 10. Frontend — BDD Preview Panel

- [x] 10.1 Create BDD preview panel component — renders proposed Feature/Scenario cards
- [x] 10.2 Display new Features with "New" badge, modified Features with changed Scenarios highlighted
- [x] 10.3 Collapse unchanged Scenarios in modified Features
- [x] 10.4 Implement "Apply All" button — calls apply endpoint, shows success state
- [x] 10.5 Implement "Discard Changes" button — confirmation dialog, calls discard endpoint, clears preview
