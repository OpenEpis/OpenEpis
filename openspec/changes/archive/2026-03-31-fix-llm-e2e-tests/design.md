## Context

The conversational BDD pipeline (`@openepis/core` agent → `conversations.ts` SSE route → frontend) has three bugs that prevent all LLM-dependent e2e tests from passing. The tests exist but are gated behind `test.skip(!hasLlmConfig)` and even with LLM config provided, the pipeline fails silently due to data shape mismatches and missing field extraction.

Current flow:

1. User sends message → `POST /api/conversations/:id/messages`
2. Server creates `BddAgent` from `@openepis/core`, subscribes to events
3. Agent calls `update_bdd` tool → `tool_execution_end` event fires
4. Server extracts changes from event, merges into `pendingChanges`, emits `bdd-change` SSE
5. On `agent_end`, server calls `fromPiMessages()` to persist messages

## Goals / Non-Goals

**Goals:**

- Fix the three identified bugs so the full conversational BDD pipeline works end-to-end
- Ensure all existing LLM-dependent e2e tests pass when LLM config is provided
- Add additional e2e test cases for error handling and edge cases

**Non-Goals:**

- Changing the agent architecture or prompt engineering
- Adding new API endpoints or changing the SSE event format
- Modifying the web UI components

## Decisions

### 1. Fix `update_bdd` details extraction (conversations.ts)

**Current**: `event.result.details` is cast directly as `GeneratedChanges`
**Problem**: `update-bdd.ts` returns `details: { new_features: number, modified_features: number, changes: params }` — the actual `GeneratedChanges` object is at `details.changes`
**Fix**: Change `event.result.details as GeneratedChanges` → `event.result.details.changes as GeneratedChanges`

This is the most impactful bug — without it, `bdd-change` events have wrong data and `pending_changes` is never correctly populated.

### 2. Add `temp_id` generation in `update_bdd` tool

**Current**: `UpdateBddParams` schema has no `temp_id` field; `GeneratedChanges` type requires `temp_id` on each new feature
**Fix**: In `update-bdd.ts` execute(), generate a `crypto.randomUUID()` for each new feature that doesn't have one, and include it in the returned `changes` object. Also add `temp_id` as optional in the schema (so the LLM can provide one, but we'll generate a fallback).

Alternative considered: require temp_id in schema — rejected because LLMs may not reliably generate UUIDs, better to generate server-side.

### 3. Extract `tool_calls` in `fromPiMessages`

**Current**: `fromPiMessages` extracts only `type: "text"` content blocks from assistant messages
**Problem**: Pi agent messages include `type: "tool_use"` blocks with tool name and arguments; these are not mapped to `ConversationMessage.tool_calls`
**Fix**: In the `assistant` branch of `fromPiMessages`, also scan for `tool_use` content blocks and map them to the `tool_calls` array.

Pi agent's assistant message content looks like:

```typescript
content: [
  { type: "text", text: "..." },
  { type: "tool_use", id: "...", name: "update_bdd", input: {...} }
]
```

Map to:

```typescript
tool_calls: [{ name: "update_bdd", arguments: {...} }]
```

### 4. E2E test expansion

Add new test cases covering:

- SSE error event when LLM config is missing/invalid
- Empty conversation apply returns 400
- Multi-turn conversation message count and ordering
- `bdd-change` event structure validation (temp_id present, scenarios non-empty)
- Agent error propagation through SSE

## Risks / Trade-offs

- **LLM non-determinism**: e2e tests hitting real LLMs are inherently flaky. Mitigated by using generous timeouts and testing structural properties (not exact content).
- **Pi agent internal API**: We depend on the shape of `AgentMessage.content` blocks from `@mariozechner/pi-agent-core`. If the library changes its message format, `fromPiMessages` will break. Mitigated by type assertions with clear comments.
