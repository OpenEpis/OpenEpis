## Why

API keys are stored in `llm_configs.api_key_encrypted` but currently pass through as plaintext — no encryption or decryption happens. A compromised database dump would expose every provider API key. We need AES-256-GCM encryption at the storage layer so keys are encrypted at rest and only decrypted when needed by `AiSdkLlmService`.

Additionally, `LlmConfig` currently only stores `api_key` and `base_url`, but AI SDK providers accept extra settings (Anthropic: `authToken`, `headers`; OpenAI: `organization`, `project`, `headers`). These provider-specific options need a place to live so they can be passed through to `createAnthropic`/`createOpenAI`.

## What Changes

- Add a `CryptoService` utility in `@openepis/storage-pg` that performs AES-256-GCM encryption/decryption using a `ENCRYPTION_KEY` from environment
- `PostgresLlmConfigStorage.create()` and `update()` encrypt the API key before INSERT/UPDATE
- `PostgresLlmConfigStorage.findById()` and `findByScope()` decrypt the API key when reading
- Add a `provider_config` JSONB column to the `llm_configs` table for extra provider settings (headers, organization, project, authToken, etc.)
- Update `LlmConfig` type to include `provider_config`
- Update `AiSdkLlmService.createModel()` to spread `provider_config` into `createAnthropic()`/`createOpenAI()`

## Capabilities

### New Capabilities

- `api-key-encryption`: AES-256-GCM encryption/decryption of API keys in the PostgreSQL storage layer
- `llm-provider-config`: JSONB `provider_config` column for pass-through provider settings to AI SDK

### Modified Capabilities

- `postgresql-storage`: llm_configs schema adds `provider_config` column; repository layer gains encrypt/decrypt logic
- `llm-service`: `AiSdkLlmService.createModel()` spreads `provider_config` into provider constructors

## Impact

- **Packages**: `@openepis/storage-pg`, `@openepis/types`, `@openepis/llm`
- **Schema**: New `provider_config` JSONB column on `llm_configs` (migration required)
- **Environment**: New `ENCRYPTION_KEY` env var required (32-byte hex or base64)
- **Data**: Existing plaintext API keys will need a one-time migration to encrypted form
