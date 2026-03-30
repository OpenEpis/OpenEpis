## 1. CryptoService

- [x] 1.1 Create `packages/storage-pg/src/crypto-service.ts` with `CryptoService` class (AES-256-GCM encrypt/decrypt, reads `ENCRYPTION_KEY` from `process.env`)
- [x] 1.2 Export `CryptoService` from `packages/storage-pg/src/index.ts`

## 2. Schema & Types

- [x] 2.1 Add `provider_config` JSONB column (nullable, default null) to `packages/storage-pg/src/schema/llm-configs.ts`
- [x] 2.2 Add `provider_config: Record<string, unknown> | null` to `LlmConfig` in `packages/types/src/entities.ts`
- [x] 2.3 Generate Drizzle migration for the new column (`pnpm db:pg:generate`)

## 3. Storage Layer

- [x] 3.1 Update `PostgresLlmConfigStorage` constructor to accept `CryptoService`
- [x] 3.2 Encrypt `api_key` in `create()` and `update()` using `CryptoService` (null-safe)
- [x] 3.3 Decrypt `api_key_encrypted` in `toEntity()` using `CryptoService` (null-safe)
- [x] 3.4 Map `provider_config` column in `toEntity()`, `create()`, and `update()`

## 4. Wiring

- [x] 4.1 Create `CryptoService` in `PostgresStorageService` and pass to `PostgresLlmConfigStorage`
- [x] 4.2 Add `ENCRYPTION_KEY` to `.env.example`

## 5. LLM Service

- [x] 5.1 Update `AiSdkLlmService.createModel()` to spread `provider_config` into `createAnthropic()`/`createOpenAI()` options (with `apiKey`/`baseURL` precedence)

## 6. Verification

- [x] 6.1 Build all packages (`pnpm build`) and verify no type errors
- [x] 6.2 Lint all packages (`pnpm lint`)
