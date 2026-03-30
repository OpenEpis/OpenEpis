## 1. Schema & Type Updates

- [x] 1.1 ~~Rename column~~ Keep DB column as `api_key_encrypted`; no schema change needed
- [x] 1.2 Update `LlmConfig` entity type in `packages/types/src/entities.ts` (add `api_key: string | null`)
- [x] 1.3 ~~Generate migration~~ No migration needed; DB column unchanged
- [x] 1.4 Update `PostgresLlmConfigStorage` to map `api_key_encrypted` ↔ `api_key` in read/write

## 2. New `packages/llm` Package

- [x] 2.1 Scaffold `packages/llm/` — `package.json`, `tsconfig.json`, `src/index.ts`
- [x] 2.2 Add dependencies: `ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`, `zod`; add `@openepis/storage` as workspace dependency
- [x] 2.3 Already covered by `packages/*` glob in `pnpm-workspace.yaml`; turbo.json needs no changes

## 3. Interface & Implementation

- [x] 3.1 Create `src/interface.ts` — define `ILlmService`, `GenerateTextOptions`, `GenerateObjectOptions`, `GenerateTextResult`, `GenerateObjectResult`
- [x] 3.2 Create `src/ai-sdk-service.ts` — implement `AiSdkLlmService` with constructor accepting `ILlmConfigStorage`
- [x] 3.3 Implement config resolution logic (configId → project scope → platform scope fallback)
- [x] 3.4 Implement dynamic provider creation (`claude` → `createAnthropic`, `openai` → `createOpenAI`)
- [x] 3.5 Implement `generateText()` method wrapping AI SDK's `generateText()`
- [x] 3.6 Implement `generateObject<T>()` method using AI SDK's `generateText()` + `Output.object()` (v6 pattern)
- [x] 3.7 Export `ILlmService`, `AiSdkLlmService`, and all option/result types from `src/index.ts`

## 4. DI Container Integration

- [x] 4.1 Add `TOKENS.LlmService` symbol and `ILlmService` to `TokenMap` in `apps/server/src/container.ts`
- [x] 4.2 Register `AiSdkLlmService` factory in server startup (wire with `storage.llmConfigs`)
- [x] 4.3 Add `@openepis/llm` as dependency to `apps/server/package.json`

## 5. Verify

- [x] 5.1 Run `pnpm install` and `pnpm build` — all packages compile cleanly
- [x] 5.2 Run `pnpm lint` — no lint errors
