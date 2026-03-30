## Why

OpenEpis needs an agent workflow engine to power conversational BDD generation — the core product capability where PMs chat with AI and receive structured BDD proposals. The existing `@openepis/llm` package (Vercel AI SDK wrapper) only supports single-shot `generateText`/`generateObject` calls. It cannot handle multi-step agent loops where the LLM autonomously reasons, calls tools (search features, fetch details, propose BDD changes), and iterates until done.

Pi Agent Core (`@mariozechner/pi-agent-core`) + Pi AI (`@mariozechner/pi-ai`) provide exactly this: a stateful agent loop with structured events, tool execution hooks, and context management — eliminating the need to build custom agent infrastructure.

## What Changes

- Add a new `packages/core` package containing the BDD agent workflow engine
- `createBddAgent()` factory assembles system prompt (three-layer context), tools, and Pi Agent instance
- Three tools: `get_feature_detail` (on-demand context), `search_features` (keyword discovery), `update_bdd` (propose BDD changes)
- `mergeChanges()` pure function for accumulating BDD changes across conversation turns
- `buildSystemPrompt()` implements three-layer context assembly (feature index + related features + PRD)
- Message format conversion between OpenEpis `ConversationMessage` and Pi `AgentMessage`
- Context pruning via Pi's `transformContext` hook
- `IBddContextService` interface for dependency-inverted read access (implemented by server)
- Remove `packages/llm` — replaced entirely by pi-ai within `@openepis/core`
- Update server: remove `ILlmService` from DI container, add `BddContextServiceImpl` adapter
- Update server: pass LLM config (provider/model/apiKey from `llm_configs` table) to `createBddAgent()`

## Capabilities

### New Capabilities

- `core-agent`: BDD agent workflow engine — Pi Agent integration, system prompt assembly, tool definitions, change accumulation, message conversion, context pruning
- `bdd-context-service`: Server-side adapter implementing `IBddContextService` over `IStorageService`

### Modified Capabilities

- `server-di`: Remove `LlmService` token; server creates agent directly via `createBddAgent()` when handling conversation messages

## Impact

- **New package**: `packages/core` (new workspace member)
- **Removed package**: `packages/llm` (deleted)
- **Modified packages**: `apps/server` (remove LLM DI, add BddContextServiceImpl adapter), `packages/types` (update `GeneratedChanges` type for granular operations)
- **New dependencies**: `@mariozechner/pi-agent-core`, `@mariozechner/pi-ai`, `@sinclair/typebox` (for tool schemas)
- **Removed dependencies**: `ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`, `zod` (from packages/llm)
