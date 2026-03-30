## Why

OpenEpis needs to call LLMs to generate BDD features/scenarios from PRD documents. The `llm_configs` table already stores provider configurations (claude, openai), but there is no runtime abstraction to actually invoke LLM APIs. A unified provider interface is needed so the server can generate structured BDD output regardless of which LLM backend is configured.

## What Changes

- Add a new `packages/llm` package containing `ILlmService` interface and a Vercel AI SDK-based implementation (`AiSdkLlmService`)
- `ILlmService` exposes `generateText()` and `generateObject<T>()` (Zod schema-based structured output)
- `AiSdkLlmService` takes `ILlmConfigStorage` as dependency, dynamically resolves provider (Anthropic / OpenAI) from DB config
- Config resolution priority: explicit `configId` → project-scope active config → platform-scope active config
- Register `ILlmService` in the server DI container (`TOKENS.LlmService`)
- Update `llm_configs` schema: rename `api_key_encrypted` to `api_key` (first phase stores plaintext; future encryption is `storage-pg`'s responsibility)
- Add `@ai-sdk/anthropic`, `@ai-sdk/openai`, `ai`, and `zod` as dependencies

## Capabilities

### New Capabilities

- `llm-service`: LLM provider abstraction — interface definition, AI SDK implementation, dynamic provider resolution from DB config, and DI integration

### Modified Capabilities

- `storage-interface`: Add plaintext `api_key` field (rename from `api_key_encrypted`) on `ILlmConfigStorage` / `LlmConfig` type
- `server-di`: Register `LlmService` token in the DI container

## Impact

- **New package**: `packages/llm` (new workspace member)
- **Modified packages**: `packages/types` (LlmConfig entity), `packages/storage` (interface), `packages/storage-pg` (schema + repository), `apps/server` (container)
- **New dependencies**: `ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`, `zod`
- **DB migration**: `llm_configs.api_key_encrypted` → `llm_configs.api_key` column rename
