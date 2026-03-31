## 1. Fix update_bdd result extraction

- [x] 1.1 Fix `conversations.ts:203` — change `event.result.details as GeneratedChanges` to `event.result.details.changes as GeneratedChanges`
- [x] 1.2 Add `temp_id` generation in `update-bdd.ts` execute() — assign `crypto.randomUUID()` to each new feature that lacks a `temp_id`
- [x] 1.3 Add optional `temp_id` field to `UpdateBddParams` schema in `schemas.ts`

## 2. Fix fromPiMessages tool_calls extraction

- [x] 2.1 In `convert.ts` `fromPiMessages()`, extract `tool_use` content blocks from assistant messages and map to `ConversationMessage.tool_calls`

## 3. Add e2e test cases for SSE and agent behavior

- [x] 3.1 Add test: `bdd-change event has valid new_features with temp_id` (validate temp_id is non-empty UUID on each new feature)
- [x] 3.2 Add test: `pending_changes structure matches GeneratedChanges type` (validate new_features is array of objects, not numbers)
- [x] 3.3 Add test: `SSE stream handles missing LLM config gracefully` (remove LLM config, send message, expect error)
- [x] 3.4 Add test: `multi-turn conversation preserves message ordering` (send 2 messages, verify user/assistant interleaving)
- [x] 3.5 Add test: `apply after multi-turn creates correct features` (multi-turn → apply → verify features in DB)

## 4. Verify all existing e2e tests pass

- [x] 4.1 Run full e2e test suite with LLM config and verify all previously-blocked tests pass (requires running server + LLM config)
