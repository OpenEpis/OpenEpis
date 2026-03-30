## Context

OpenEpis stores LLM provider configurations in the `llm_configs` table (provider, model, api_key, base_url, scope). The server DI container currently registers only `IStorageService`. There is no runtime code to invoke LLM APIs. The project needs a thin abstraction layer that reads config from DB and calls the appropriate provider to generate structured BDD output.

## Goals / Non-Goals

**Goals:**

- Unified `ILlmService` interface for text and structured object generation
- Dynamic provider resolution from `llm_configs` DB records (Anthropic, OpenAI)
- Integrate into existing DI container pattern
- Support Zod-based structured output for BDD generation

**Non-Goals:**

- Streaming support (deferred to MVP-1)
- Ollama support (can be added later via community provider)
- RAG, agent chains, or tool calling
- API key encryption (first phase stores plaintext; future encryption is `storage-pg`'s internal concern)
- Prompt engineering or BDD-specific generation logic (that's the caller's responsibility)

## Decisions

### 1. Vercel AI SDK as the provider abstraction

Use the `ai` package with `@ai-sdk/anthropic` and `@ai-sdk/openai` provider plugins.

**Why over LangChain**: LangChain brings heavy Chain/Agent/RAG abstractions we don't need. AI SDK is function-oriented, lightweight, and has first-class `generateObject()` with Zod schemas — a perfect fit for structured BDD output.

**Why over hand-rolled**: Structured output, streaming (future), and cross-provider normalization are non-trivial to implement correctly. AI SDK already handles these.

### 2. Single `packages/llm` package (interface + implementation together)

No separate `packages/llm-interface` and `packages/llm-ai-sdk` split.

**Why**: The AI SDK itself is already a provider abstraction. We won't swap it out for another meta-framework. One package keeps things simple. If a second implementation is ever needed, extract the interface then.

### 3. `ILlmConfigStorage` injected, not `IStorageService`

`AiSdkLlmService` receives only `ILlmConfigStorage` (the sub-interface it needs), not the entire `IStorageService`.

**Why**: Follows interface segregation. The LLM service only needs config lookup, not access to projects, features, etc. The server container does the wiring: `new AiSdkLlmService(storage.llmConfigs)`.

### 4. Config resolution: configId → project scope → platform scope

When resolving which LLM to use:

1. If `configId` is provided, look up that specific record
2. Else if `projectId` is provided, find the active config with `scope=project, scope_id=projectId`
3. Else fall back to active config with `scope=platform`
4. If nothing found, throw a descriptive error

**Why**: Allows platform-wide defaults with per-project overrides, while still supporting explicit config selection for advanced use cases.

### 5. Rename `api_key_encrypted` → `api_key`

First phase stores plaintext. The column rename clarifies intent and avoids misleading names.

**Why**: Encryption is a storage-layer concern. When encryption is added later, `PostgresLlmConfigStorage` will encrypt on write and decrypt on read internally — the column can stay `api_key` and the interface stays unchanged.

## Risks / Trade-offs

- **[Plaintext API keys in DB]** → Acceptable for MVP. Mitigation: restrict DB access; encryption planned as `storage-pg` internal improvement.
- **[AI SDK is Vercel-maintained]** → Well-maintained OSS with MIT license, active community. Low vendor risk since the wrapper is thin — migrating away would be straightforward.
- **[Zod as new dependency]** → Added to `packages/llm` only. Does not leak into other packages unless they choose to import it. AI SDK requires Zod for `generateObject()`.
- **[DB lookup per LLM call]** → Config resolution hits DB each time. Mitigation: configs rarely change; can add in-memory caching later if needed. Keeps implementation simple for now.
