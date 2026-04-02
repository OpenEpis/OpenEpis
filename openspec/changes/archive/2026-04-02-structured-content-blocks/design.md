## Context

`ConversationMessage.content` is currently `string`, while the upstream pi-ai library uses structured content block arrays (`(TextContent | ThinkingContent | ToolCall)[]` for assistant messages, `string | (TextContent | ImageContent)[]` for user messages). The `convert.ts` bridge flattens assistant content blocks into a single string and extracts tool calls into a separate `tool_calls` field, losing block ordering, thinking content, and tool result messages entirely.

No production data exists yet, so the schema can be changed without migration cost.

## Goals / Non-Goals

**Goals:**

- Replace `ConversationMessage.content: string` with `content: ContentBlock[]` — a discriminated union owned by `@openepis/types`, not coupled to pi-ai
- Remove the separate `tool_calls` field — tool use becomes a content block
- Rewrite `convert.ts` as a lossless block-to-block mapping (text, image, tool_use, tool_result)
- Keep the `POST /api/conversations/:id/messages` endpoint backward-friendly: accept `content: string` (server wraps as `[{ type: "text", text }]`) or `content: ContentBlock[]`
- Update frontend streaming hook and e2e tests for the new shape
- Handle thinking blocks from pi-ai (map to `thinking` content block type for potential future use, rather than dropping them)

**Non-Goals:**

- Multimodal upload UI (image/file attachment in the web app) — deferred
- Changing the SSE event protocol (text-delta, bdd-change, done events stay the same)
- Database migration — JSONB column accepts the new shape directly
- Changing the `GeneratedChanges` or `pending_changes` types

## Decisions

### D1: ContentBlock is an OpenEpis-owned discriminated union

Define in `@openepis/types`:

```typescript
type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mimeType: string }
  | { type: "tool_use"; id: string; name: string; arguments: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean }
  | { type: "thinking"; thinking: string };
```

**Why not reuse pi-ai types directly?** OpenEpis types are the API contract; coupling them to a third-party library would leak internal concerns. The `convert.ts` layer maps between the two.

**Why include `thinking`?** Pi-ai emits thinking blocks for reasoning models. Preserving them (rather than dropping) enables future debugging/audit UI at near-zero extra cost. They're excluded from the REST API response by default — only stored in the DB.

**Why `tool_use` / `tool_result` instead of pi-ai's `toolCall` / `toolResult`?** Snake_case matches the existing OpenEpis naming convention and aligns with Anthropic API naming, which is the primary LLM provider.

### D2: ConversationMessage shape

```typescript
interface ConversationMessage {
  role: "system" | "assistant" | "user" | "tool_result";
  content: ContentBlock[];
  timestamp: string;
}
```

Changes from current:

- `content` changes from `string` to `ContentBlock[]`
- `tool_calls` field removed — tool calls are `{ type: "tool_use" }` blocks inside `content`
- New `role: "tool_result"` to represent tool result messages (currently dropped by `fromPiMessages`)

**Alternative considered: keep role as 3-value enum, embed tool_result in content blocks only.** Rejected because pi-ai models tool results as separate messages with their own role, and the e2e tests already assert on tool_calls presence — using a dedicated role makes the mapping cleaner and assertions more direct.

### D3: convert.ts rewrite strategy

**`toPiMessages`**: Block-to-block mapping.

- `user` messages: map `ContentBlock[]` → pi-ai `(TextContent | ImageContent)[]` (filter out non-applicable types)
- `assistant` messages: map `ContentBlock[]` → pi-ai `(TextContent | ThinkingContent | ToolCall)[]`
- `tool_result` messages: map to pi-ai `ToolResultMessage`
- `system` messages: skip (unchanged)

**`fromPiMessages`**: Reverse mapping.

- `user` messages: map pi-ai content → `ContentBlock[]`
- `assistant` messages: map text, thinking, toolCall blocks → corresponding `ContentBlock` types
- `toolResult` messages: map to `ConversationMessage` with `role: "tool_result"` (no longer dropped)

This eliminates the lossy string-flattening and tool_calls extraction.

### D4: Server endpoint accepts string or ContentBlock[]

`POST /api/conversations/:id/messages` body type:

```typescript
{ content: string } | { content: ContentBlock[] }
```

When `content` is a string, the server wraps it as `[{ type: "text", text: content }]`. This keeps the API simple for plain text messages while supporting structured content.

### D5: Frontend streaming hook changes

`use-conversation-stream.ts` currently accumulates text deltas into a string and creates `ConversationMessage` with `content: string`. After the change:

- User message: wrap the input string as `[{ type: "text", text }]`
- Assistant message on done: wrap accumulated text as `[{ type: "text", text }]`
- The hook's public interface stays the same (`sendMessage(content: string)`) — the ContentBlock wrapping is internal

This is a minimal change that preserves the existing streaming UX. Rendering of tool_use, tool_result, and thinking blocks in the UI is a future concern.

## Risks / Trade-offs

**[Existing tests assert on `message.content` as string and `message.tool_calls`]** All e2e tests that read back messages need updating. Since the test count is bounded and assertions are straightforward, risk is low. -> Mitigation: update assertions to check `content[0].text` for text and filter `content.filter(b => b.type === "tool_use")` for tool calls.

**[Frontend rendering assumes string content]** Any component that renders `message.content` directly will break. -> Mitigation: create a small `getTextContent(message)` helper that extracts text from ContentBlock[], used in rendering and the streaming hook.

**[Third-party type drift]** Pi-ai may change its content block types in future versions. -> Mitigation: the `convert.ts` layer isolates OpenEpis types from pi-ai types. Only convert.ts needs updating when pi-ai changes.

**[tool_result messages increase stored data]** Previously dropped, now persisted. -> Mitigation: Negligible size increase. The content is already in pi-ai's message array during the agent run; we're just persisting it now.
