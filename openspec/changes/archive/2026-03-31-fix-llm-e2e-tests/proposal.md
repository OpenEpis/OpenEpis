## Why

LLM-related e2e tests (`conversations.spec.ts` SSE tests, `agent-behavior.spec.ts`, `web/conversations.spec.ts` chat/BDD preview tests) are all gated behind `test.skip(!hasLlmConfig)` and currently blocked by bugs in the core agent code. Specifically:

1. **`update_bdd` result extraction bug**: In `conversations.ts:203`, `event.result.details` is treated as `GeneratedChanges` but `update-bdd.ts` returns `details: { new_features: number, modified_features: number, changes: params }` — the actual changes are nested inside `details.changes`, so `mergeChanges` receives the wrong shape and `bdd-change` events either fail or produce empty/malformed pending_changes.
2. **`fromPiMessages` drops tool_calls**: The converter only extracts text content from assistant messages but never populates the `tool_calls` field defined on `ConversationMessage`, causing `agent-behavior.spec.ts` test "conversation messages contain tool_calls metadata" to fail.
3. **`update_bdd` schema missing `temp_id`**: The `UpdateBddParams` schema has no `temp_id` field on new features, but `GeneratedChanges` type requires it and the agent-behavior test validates it.

These bugs block all LLM-dependent e2e tests from passing and prevent validation of the core conversational BDD pipeline.

## What Changes

- **Fix `update_bdd` result extraction**: Extract `event.result.details.changes` (not `event.result.details`) when merging into pending_changes.
- **Fix `fromPiMessages` to extract tool_calls**: Parse `tool_use` content blocks from Pi assistant messages and map them to the `ConversationMessage.tool_calls` field.
- **Add `temp_id` to `UpdateBddParams` schema**: Generate a `temp_id` in the `update_bdd` tool execution so `GeneratedChanges` contract is satisfied.
- **Add comprehensive e2e test cases**: Expand coverage for error scenarios, edge cases (empty BDD, multi-turn accumulation correctness), and SSE event structure validation.

## Capabilities

### New Capabilities

### Modified Capabilities

## Impact

- `packages/core/src/tools/update-bdd.ts` — fix details structure, add temp_id
- `packages/core/src/tools/schemas.ts` — add optional temp_id field
- `packages/core/src/context/convert.ts` — extract tool_calls in `fromPiMessages`
- `apps/server/src/routes/conversations.ts` — fix `event.result.details.changes` extraction
- `tests/e2e/api/conversations.spec.ts` — new test cases
- `tests/e2e/api/agent-behavior.spec.ts` — new test cases
- `tests/e2e/web/conversations.spec.ts` — potentially affected
