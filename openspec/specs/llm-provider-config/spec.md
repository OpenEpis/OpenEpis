## ADDED Requirements

### Requirement: provider_config JSONB column

The `llm_configs` table SHALL have a `provider_config` column of type JSONB, nullable, defaulting to `null`.

This column stores provider-specific settings that are passed through to AI SDK provider constructors (`createAnthropic`, `createOpenAI`).

#### Scenario: Schema includes provider_config

- **WHEN** the `llm_configs` Drizzle schema is loaded
- **THEN** the `provider_config` column exists as a nullable JSONB column

#### Scenario: Default value is null

- **WHEN** a new `llm_configs` row is inserted without specifying `provider_config`
- **THEN** the `provider_config` column defaults to `null`

### Requirement: LlmConfig type includes provider_config

The `LlmConfig` type in `@openepis/types` SHALL include a `provider_config` field typed as `Record<string, unknown> | null`.

#### Scenario: Type definition

- **WHEN** a consumer imports `LlmConfig` from `@openepis/types`
- **THEN** the `provider_config` field is available with type `Record<string, unknown> | null`

### Requirement: Provider config pass-through in AiSdkLlmService

`AiSdkLlmService.createModel()` SHALL spread `LlmConfig.provider_config` into the options passed to `createAnthropic()` or `createOpenAI()`, after `apiKey` and `baseURL`.

`apiKey` and `baseURL` from the dedicated fields SHALL take precedence over any same-named keys in `provider_config`.

If `provider_config` is `null`, only `apiKey` and `baseURL` SHALL be passed.

#### Scenario: Anthropic with extra headers

- **WHEN** a `LlmConfig` has `provider: "claude"` and `provider_config: { "headers": { "X-Custom": "value" } }`
- **THEN** `createAnthropic()` is called with `{ apiKey, baseURL, headers: { "X-Custom": "value" } }`

#### Scenario: OpenAI with organization

- **WHEN** a `LlmConfig` has `provider: "openai"` and `provider_config: { "organization": "org-123", "project": "proj-456" }`
- **THEN** `createOpenAI()` is called with `{ apiKey, baseURL, organization: "org-123", project: "proj-456" }`

#### Scenario: Null provider_config

- **WHEN** a `LlmConfig` has `provider_config: null`
- **THEN** `createAnthropic()`/`createOpenAI()` is called with only `{ apiKey, baseURL }`

#### Scenario: Dedicated fields take precedence

- **WHEN** a `LlmConfig` has `api_key: "sk-real"` and `provider_config: { "apiKey": "sk-override" }`
- **THEN** the provider is created with `apiKey: "sk-real"` (dedicated field wins)
