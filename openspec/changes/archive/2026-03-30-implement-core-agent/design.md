## Context

OpenEpis has a `packages/llm` package (Vercel AI SDK wrapper) that supports single-shot `generateText`/`generateObject`. The architecture document (`docs/core-agent-architecture.md`) specifies replacing it with a Pi Agent Core-based agent workflow in a new `packages/core` package. The server currently registers `ILlmService` in its DI container. The `llm_configs` DB table stores provider/model/apiKey configuration and will continue to be used, but read by the server and passed to `createBddAgent()` instead of through an `ILlmService` abstraction.

## Goals / Non-Goals

**Goals:**

- Implement `packages/core` with `createBddAgent()`, three tools, system prompt assembly, and change accumulation
- Define `IBddContextService` interface in core for dependency-inverted read access
- Implement `BddContextServiceImpl` adapter in server
- Remove `packages/llm` entirely
- Clean up server DI container (remove `LlmService` token)
- Update `GeneratedChanges` type to support granular modified_features operations

**Non-Goals:**

- Conversation CRUD routes (separate change — data model updates needed first)
- SSE streaming endpoint (`POST /api/conversations/:id/messages`) — requires conversation routes
- Web UI for conversational BDD (Phase 5 per conversational-bdd.md)
- Apply/discard endpoints — depends on conversation routes
- File upload support
- `prd_id` nullable migration on conversations table

## Decisions

### 1. Pi Agent Core + Pi AI over Vercel AI SDK

Use `@mariozechner/pi-agent-core` for the agent loop and `@mariozechner/pi-ai` for LLM abstraction.

**Why**: Pi Agent provides stateful agent loop, structured events (`agent_start` → `turn_start` → `message_update` → `tool_execution_*` → `agent_end`), `transformContext` hook, and `beforeToolCall`/`afterToolCall` hooks. Vercel AI SDK would require building all of this manually. The event system is critical for propagating `update_bdd` results to the server for SSE forwarding.

### 2. TypeBox for tool schemas (not Zod)

Pi uses TypeBox (`@sinclair/typebox`) for tool parameter schemas.

**Why**: Pi Agent Core's `AgentTool` type expects TypeBox schemas. Using Zod would require a conversion layer. TypeBox is already a transitive dependency of pi-agent-core.

### 3. IBddContextService defined in core, implemented in server

Core defines the port (`IBddContextService`). Server implements the adapter (`BddContextServiceImpl`) wrapping `IStorageService`.

**Why**: Core must not depend on `@openepis/storage`. The dependency is inverted — core declares what it needs, server provides it. This keeps core testable and storage-agnostic.

### 4. Model creation via pi-ai's getModel() or custom Model object

Server reads `llm_configs` from DB → passes `ModelConfig` (provider, modelId, apiKey, baseUrl, providerConfig) to `createBddAgent()`. Core resolves the model:

- **No custom baseUrl** → `getModel(provider, modelId)` from pi-ai (uses default endpoints)
- **Has custom baseUrl** → manually construct a `Model` object with `baseUrl` and optional `headers` from `providerConfig`

API key is passed via pi-agent-core's `getApiKey` hook in both cases.

**Why**: Pi-ai's `Model` type natively supports `baseUrl` and `headers` fields, enabling proxy endpoints, corporate gateways, and local inference servers (Ollama). The `getApiKey` callback avoids hardcoding keys in the model object. Using `getModel()` for standard providers keeps things simple; custom `Model` construction is only needed when `base_url` is configured in `llm_configs`.

### 5. update_bdd is pure logic — no storage writes

The `update_bdd` tool returns a confirmation string to the LLM. The actual `GeneratedChanges` data is captured by the server via Pi's `tool_execution_end` event and merged into `conversation.pending_changes`.

**Why**: Core should not write to storage. BDD changes are proposals, not commits. The server decides when/how to persist them.

### 6. mergeChanges() as a pure function in core

Change accumulation logic (`mergeChanges`) is a pure function: `(existing, incoming) → merged`. No side effects.

**Why**: Testable, composable. Server calls it when processing `tool_execution_end` events. The merge rules (same title replaces, same feature_id merges, new entries append) are deterministic.

### 7. Delete packages/llm completely

Remove `packages/llm` directory, its workspace entry is handled by `packages/*` glob, remove `@openepis/llm` dependency from `apps/server/package.json`, and remove `TOKENS.LlmService` from the DI container.

**Why**: Pi-ai fully replaces Vercel AI SDK. Keeping `packages/llm` around would be dead code. The `llm_configs` table and `ILlmConfigStorage` interface are unaffected — they still store configuration.

## Package Structure

```
packages/core/
├── src/
│   ├── index.ts                   # Public API exports
│   ├── agent.ts                   # createBddAgent() implementation
│   ├── changes.ts                 # mergeChanges() pure function
│   ├── prompt/
│   │   ├── system-prompt.ts       # buildSystemPrompt() — three-layer context
│   │   └── templates.ts           # Prompt template strings
│   ├── tools/
│   │   ├── index.ts               # createTools() — assemble all tools
│   │   ├── schemas.ts             # TypeBox schemas for tool parameters
│   │   ├── get-feature-detail.ts  # get_feature_detail tool
│   │   ├── search-features.ts     # search_features tool
│   │   └── update-bdd.ts          # update_bdd tool
│   ├── context/
│   │   ├── transform.ts           # transformContext — context pruning hook
│   │   └── convert.ts             # OpenEpis ↔ Pi message conversion
│   └── types.ts                   # All exported types (IBddContextService, etc.)
├── package.json
└── tsconfig.json
```

## Risks / Trade-offs

- **[Pi Agent Core is external dependency]** → Maintained by badlogic (pi-mono). MIT licensed, actively developed. The wrapper is thin enough that switching away is feasible if needed.
- **[TypeBox instead of Zod]** → Different schema library than what was used in packages/llm. TypeBox is required by Pi. Does not leak into other packages — only used in core's tool definitions.
- **[No streaming endpoint in this change]** → Core provides the agent and events, but the SSE streaming route (`POST /conversations/:id/messages`) is not implemented here. That requires conversation CRUD routes first.
- **[getModel() uses env vars by default for API keys]** → We override this with the `getApiKey` hook to supply keys from DB config. Must ensure the hook is correctly wired.
