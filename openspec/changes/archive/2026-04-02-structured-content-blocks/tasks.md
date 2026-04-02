## 1. Types

- [x] 1.1 Define `ContentBlock` discriminated union type in `packages/types/src/entities.ts`
- [x] 1.2 Update `ConversationMessage` — change `content` from `string` to `ContentBlock[]`, remove `tool_calls`, add `role: "tool_result"`
- [x] 1.3 Build `@openepis/types` and verify no type errors

## 2. Core conversion layer

- [x] 2.1 Rewrite `toPiMessages` in `packages/core/src/context/convert.ts` as block-to-block mapping (user, assistant, tool_result; skip system)
- [x] 2.2 Rewrite `fromPiMessages` to produce `ContentBlock[]` content — map text, thinking, toolCall blocks; map `ToolResultMessage` to `role: "tool_result"` messages
- [x] 2.3 Build `@openepis/core` and fix any type errors from the new `ConversationMessage` shape

## 3. Server routes

- [x] 3.1 Update `POST /api/conversations/:id/messages` in `apps/server/src/routes/conversations.ts` to accept `content: string | ContentBlock[]` — wrap string as `[{ type: "text", text }]`
- [x] 3.2 Update agent_end handler to persist full message array from `fromPiMessages()` (including tool_result messages)
- [x] 3.3 Build `@openepis/server` and fix any remaining type errors

## 4. Frontend

- [x] 4.1 Update `use-conversation-stream.ts` — wrap user message content and assistant accumulated text as `[{ type: "text", text }]` ContentBlock arrays
- [x] 4.2 Add `getTextContent(message: ConversationMessage): string` helper for rendering (extract text from ContentBlock[])
- [x] 4.3 Update any components that render `message.content` directly to use `getTextContent()`
- [x] 4.4 Build `@openepis/web` and fix any type errors

## 5. E2E test updates

- [x] 5.1 Update `tests/e2e/api/conversations.spec.ts` — change assertions from `message.content` string checks to `message.content[0].text` ContentBlock checks
- [x] 5.2 Update `tests/e2e/api/agent-behavior.spec.ts` — change `tool_calls` assertions to `content.filter(b => b.type === "tool_use")` assertions
- [x] 5.3 Run full e2e test suite and verify all tests pass

## 6. Verify

- [x] 6.1 Run `pnpm build` across the monorepo — no type errors
- [x] 6.2 Run `pnpm lint` — no lint errors
- [x] 6.3 Manual smoke test: send a message via API, verify response messages have `ContentBlock[]` content shape
