## 1. Scaffold packages/core

- [x] 1.1 Create `packages/core/package.json` with dependencies: `@mariozechner/pi-agent-core@^0.61.0`, `@mariozechner/pi-ai@^0.61.0`, `@sinclair/typebox`, `@openepis/types@workspace:*`
- [x] 1.2 Create `packages/core/tsconfig.json` (ESM, same pattern as other packages)
- [x] 1.3 Create directory structure: `src/`, `src/prompt/`, `src/tools/`, `src/context/`
- [x] 1.4 Create `src/index.ts` with placeholder exports
- [x] 1.5 Run `pnpm install` to register the new workspace package

## 2. Types & Interfaces

- [x] 2.1 Create `src/types.ts` — define `FeatureSummary`, `FeatureDetail`, `IBddContextService`, `BddAgentOptions`, and `ModelConfig` types
- [x] 2.2 Update `GeneratedChanges` in `packages/types/src/entities.ts` to support granular modified_features (added_scenarios, modified_scenarios, removed_scenario_ids, reason, updated_title, updated_description, temp_id on new_features, description + tags on new_features)

## 3. System Prompt Assembly

- [x] 3.1 Create `src/prompt/templates.ts` — prompt template strings (role definition, BDD formatting instructions, tool usage guidance)
- [x] 3.2 Create `src/prompt/system-prompt.ts` — `buildSystemPrompt(options)` that assembles three-layer context (feature index, related features, PRD content) into a system prompt string

## 4. Tool Definitions

- [x] 4.1 Create `src/tools/schemas.ts` — TypeBox schemas for all three tools' parameters
- [x] 4.2 Create `src/tools/get-feature-detail.ts` — tool definition that calls `IBddContextService.getFeatureDetail()`
- [x] 4.3 Create `src/tools/search-features.ts` — tool definition that calls `IBddContextService.searchFeatures()`
- [x] 4.4 Create `src/tools/update-bdd.ts` — tool definition with pure logic (validates input, returns confirmation summary to LLM)
- [x] 4.5 Create `src/tools/index.ts` — `createTools(contextService, projectId)` that assembles all tools into an array

## 5. Message Conversion & Context Pruning

- [x] 5.1 Create `src/context/convert.ts` — conversion functions between OpenEpis `ConversationMessage[]` and Pi `AgentMessage[]`
- [x] 5.2 Create `src/context/transform.ts` — `transformContext` hook for pruning old messages when context grows too large

## 6. Change Accumulation

- [x] 6.1 Create `src/changes.ts` — `mergeChanges(existing, incoming)` pure function with merge rules: same title replaces, same feature_id merges, new entries append

## 7. Agent Factory

- [x] 7.1 Create `src/agent.ts` — `createBddAgent(options)` that builds system prompt, creates tools, converts messages, and returns a configured Pi `Agent` instance
- [x] 7.2 Wire `getApiKey` hook to supply API key from `ModelConfig` option
- [x] 7.3 Wire `transformContext` hook for context pruning
- [x] 7.4 Export full public API from `src/index.ts`: `createBddAgent`, `mergeChanges`, all types

## 8. Remove packages/llm

- [x] 8.1 Delete `packages/llm/` directory entirely
- [x] 8.2 Remove `@openepis/llm` from `apps/server/package.json` dependencies
- [x] 8.3 Remove `TOKENS.LlmService` from `apps/server/src/container.ts` (remove symbol, TokenMap entry, and `ILlmService` import)
- [x] 8.4 Remove `AiSdkLlmService` registration and import from `apps/server/src/index.ts`

## 9. Server-Side Adapter

- [x] 9.1 Create `apps/server/src/services/bdd-context-service.ts` — `BddContextServiceImpl` implementing `IBddContextService` by wrapping `IStorageService`
- [x] 9.2 Add `@openepis/core` as dependency to `apps/server/package.json`

## 10. Verify

- [x] 10.1 Run `pnpm install` and `pnpm build` — all packages compile cleanly
- [x] 10.2 Run `pnpm lint` — no lint errors
