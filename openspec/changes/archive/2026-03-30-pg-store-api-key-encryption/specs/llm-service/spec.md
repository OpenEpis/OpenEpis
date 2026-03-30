## MODIFIED Requirements

### Requirement: Dynamic provider creation

`AiSdkLlmService` SHALL create AI SDK provider instances dynamically based on `LlmConfig.provider`:

- `"claude"` -> `createAnthropic()` from `@ai-sdk/anthropic`
- `"openai"` -> `createOpenAI()` from `@ai-sdk/openai`

The provider SHALL be configured with `apiKey` from `LlmConfig.api_key`, `baseURL` from `LlmConfig.base_url` (if set), and additional settings from `LlmConfig.provider_config` (if set).

`apiKey` and `baseURL` from dedicated fields SHALL take precedence over same-named keys in `provider_config`.

The model SHALL be selected using `LlmConfig.model` (e.g., `claude-sonnet-4-6`, `gpt-4o`).

#### Scenario: Unsupported provider throws error

- **WHEN** a `LlmConfig` record has an unrecognized `provider` value
- **THEN** the service throws an error indicating the provider is not supported

#### Scenario: Custom base URL is applied

- **WHEN** a `LlmConfig` has a non-null `base_url`
- **THEN** the provider instance is created with that base URL

#### Scenario: Provider config is spread into options

- **WHEN** a `LlmConfig` has a non-null `provider_config`
- **THEN** the provider instance is created with those extra settings merged in

#### Scenario: Dedicated fields override provider_config

- **WHEN** `provider_config` contains `apiKey` or `baseURL` keys
- **THEN** the dedicated `LlmConfig.api_key` and `LlmConfig.base_url` values take precedence
