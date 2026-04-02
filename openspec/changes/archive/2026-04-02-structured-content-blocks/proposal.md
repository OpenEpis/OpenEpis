## Why

`ConversationMessage.content` is currently a plain `string`, which is the odd one out — OpenAI, Anthropic, and the pi-agent-core library we depend on all use structured content block arrays. This causes two problems:

1. **Information loss in conversion**: `convert.ts` flattens `AssistantMessage` content blocks (thinking, toolCall) into a plain string on the way out, and wraps strings back into `[{ type: "text" }]` on the way in. Tool calls are split into a separate `tool_calls` field, losing their position relative to text blocks. `toolResult` messages are dropped entirely.

2. **No multimodal path**: A plain string cannot represent images, files, or other non-text content. If a PM wants to attach a UI mockup for BDD generation, the current type has no way to express it.

Since there is no production data to migrate, now is the right time to fix the foundation.

## What Changes

- **`ConversationMessage.content`**: Change from `string` to `ContentBlock[]` (always an array, no `string | array` union). Remove the separate `tool_calls` field — tool use is now a content block like everything else.
- **`ContentBlock` type**: New discriminated union in `@openepis/types` covering `text`, `image`, `tool_use`, `tool_result` block types. OpenEpis-owned types, not coupled to pi-ai.
- **`convert.ts`**: Rewrite `toPiMessages` / `fromPiMessages` as block-to-block mapping instead of string↔array shape conversion. Should be lossless for text, image, tool_use, and tool_result blocks. Thinking blocks from pi-ai can be mapped or dropped (design decision).
- **Server routes**: `conversations.ts` message handling updated — the `content` field in request body becomes `string` (convenience, server wraps it as `[{ type: "text", text }]`) or `ContentBlock[]`.
- **Frontend hooks**: `use-conversation-stream.ts` and any rendering code updated to consume `ContentBlock[]`.
- **E2E tests**: All tests that send `{ content: "..." }` or assert on `message.content` / `message.tool_calls` updated to match the new shape.
- **Database**: No migration needed — `messages` is JSONB, new shape is written directly. Old data is not a concern.

## Capabilities

### New Capabilities

- (none — this is a type/structural change, not a new feature)

### Modified Capabilities

- `conversation-api`: `ConversationMessage` shape changes — `content` becomes `ContentBlock[]`, `tool_calls` field removed
- `server-agent-integration`: `convert.ts` rewritten for block-to-block mapping
- `e2e-conversation-tests`: Tests updated for new message shape
- `e2e-agent-behavior-tests`: Tests updated for new message shape (tool_calls assertions move to content block assertions)

## Impact

- **packages/types**: `ConversationMessage` type rewritten, new `ContentBlock` union type added, `tool_calls` field removed
- **packages/core**: `convert.ts` rewritten (toPiMessages / fromPiMessages). Agent options type may simplify.
- **apps/server**: `conversations.ts` request/response handling updated for `ContentBlock[]`
- **apps/web**: `use-conversation-stream.ts` and message rendering updated
- **tests/e2e**: `conversations.spec.ts` and `agent-behavior.spec.ts` updated for new content shape
- **packages/storage-pg**: No schema migration needed (JSONB), but any TypeScript references to `ConversationMessage` will see the new type
