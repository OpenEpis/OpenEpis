## Context

`llm_configs.api_key_encrypted` currently stores API keys as plaintext. The column name implies encryption but none is implemented — `PostgresLlmConfigStorage` simply maps `api_key` ↔ `api_key_encrypted` without transformation.

Additionally, AI SDK providers (`createAnthropic`, `createOpenAI`) accept settings beyond `apiKey`/`baseURL`:

- Anthropic: `authToken`, `headers`, `name`
- OpenAI: `organization`, `project`, `headers`, `name`

These cannot currently be configured per-LlmConfig.

## Goals / Non-Goals

**Goals:**

- Encrypt API keys at rest using AES-256-GCM in `@openepis/storage-pg`
- Decrypt API keys transparently when reading from `PostgresLlmConfigStorage`
- Add a `provider_config` JSONB column for extra provider settings
- Pass `provider_config` through to AI SDK provider constructors

**Non-Goals:**

- Key rotation mechanism (future work)
- Encrypting other fields (base_url, provider_config)
- Hardware security module (HSM) or external KMS integration
- Migrating existing plaintext keys (handled by a separate migration script, not this change's scope)

## Decisions

### 1. AES-256-GCM via Node.js `node:crypto`

Use `node:crypto` with AES-256-GCM. Each encrypted value stores `iv:authTag:ciphertext` as a single base64 string.

**Why**: No external dependency needed. GCM provides authenticated encryption (integrity + confidentiality). Standard approach for application-level encryption at rest.

**Alternative considered**: `pgcrypto` extension — rejected because it ties encryption to the database, making key management harder and coupling logic to PostgreSQL.

### 2. Encryption key from environment variable

`ENCRYPTION_KEY` env var, expected as 64-char hex string (32 bytes). Validated at service initialization.

**Why**: Follows the existing pattern of `DATABASE_URL` from env. Hex encoding is unambiguous and easy to generate (`openssl rand -hex 32`).

### 3. CryptoService as a standalone utility

A `CryptoService` class in `@openepis/storage-pg` with `encrypt(plaintext): string` and `decrypt(ciphertext): string` methods. Injected into `PostgresLlmConfigStorage` via constructor.

**Why**: Testable in isolation. Can be reused if other fields need encryption later. Keeps crypto logic out of the repository class.

### 4. provider_config as JSONB column

Add `provider_config` JSONB column (nullable, defaults to `null`) to `llm_configs`. The shape is provider-specific and passed through as-is to `createAnthropic()`/`createOpenAI()` (minus `apiKey`/`baseURL` which are handled separately).

**Why**: JSONB is flexible for provider-specific settings without schema migration per-provider. Pass-through design avoids maintaining a union type that tracks every SDK version.

### 5. Encrypted value format: `base64(iv):base64(authTag):base64(ciphertext)`

Store as three colon-separated base64 segments. This is self-contained — no separate columns needed for IV or auth tag.

**Why**: Single column, easy to parse, no schema change needed for the existing `api_key_encrypted` column.

## Risks / Trade-offs

- **[Lost encryption key]** → If `ENCRYPTION_KEY` is lost, all encrypted API keys become unrecoverable. Mitigation: document key backup procedures; this is standard for any application-level encryption.
- **[Performance]** → Encrypt/decrypt on every read/write adds ~1ms. Negligible for LLM config operations (infrequent).
- **[provider_config trust]** → Passing arbitrary JSON to SDK constructors could include unexpected keys. Mitigation: AI SDK ignores unknown properties; document accepted fields.
- **[No encryption key in dev]** → Developers must set `ENCRYPTION_KEY` even locally. Mitigation: add to `.env.example`; document `openssl rand -hex 32` command.
