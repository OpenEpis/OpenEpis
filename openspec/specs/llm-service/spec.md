## ADDED Requirements

### Requirement: ILlmService interface

`packages/llm` SHALL export an `ILlmService` interface with the following methods:

- `generateText(options: GenerateTextOptions): Promise<GenerateTextResult>`
- `generateObject<T extends z.ZodType>(options: GenerateObjectOptions<T>): Promise<GenerateObjectResult<T>>`

`GenerateTextOptions` SHALL include: `prompt` (required), `system` (optional), `configId` (optional), `projectId` (optional).

`GenerateObjectOptions<T>` SHALL extend `GenerateTextOptions` with an additional `schema: T` field (Zod schema).

`GenerateTextResult` SHALL include: `text: string`.

`GenerateObjectResult<T>` SHALL include: `object: z.infer<T>`.

#### Scenario: Interface is importable

- **WHEN** a consumer imports from `@openepis/llm`
- **THEN** `ILlmService`, `GenerateTextOptions`, `GenerateObjectOptions`, `GenerateTextResult`, and `GenerateObjectResult` types are available

### Requirement: AiSdkLlmService implementation

`packages/llm` SHALL export an `AiSdkLlmService` class that implements `ILlmService` using Vercel AI SDK (`ai` package).

The constructor SHALL accept `ILlmConfigStorage` as its only parameter.

#### Scenario: Generate text with Anthropic provider

- **WHEN** `generateText()` is called with a `projectId` whose active config uses provider `claude`
- **THEN** the service resolves the config from DB, creates an Anthropic provider instance, and returns the generated text

#### Scenario: Generate text with OpenAI provider

- **WHEN** `generateText()` is called with a `projectId` whose active config uses provider `openai`
- **THEN** the service resolves the config from DB, creates an OpenAI provider instance, and returns the generated text

#### Scenario: Generate structured object

- **WHEN** `generateObject()` is called with a Zod schema
- **THEN** the service uses AI SDK's `generateObject()` with the schema and returns a typed object matching the schema

### Requirement: Config resolution with fallback chain

`AiSdkLlmService` SHALL resolve LLM configuration using this priority:

1. If `configId` is provided, look up that specific `LlmConfig` record
2. If `projectId` is provided, find the active config with `scope=project` and `scope_id=projectId`
3. Fall back to the active config with `scope=platform`
4. If no config is found, throw an error with a descriptive message

Only configs with `is_active=true` SHALL be considered (except for explicit `configId` lookup).

#### Scenario: Explicit configId takes priority

- **WHEN** `generateText()` is called with `configId: "abc-123"`
- **THEN** the service uses the config with `id=abc-123` regardless of other options

#### Scenario: Project scope config overrides platform

- **WHEN** `generateText()` is called with `projectId: "proj-1"` and no `configId`
- **AND** an active config exists with `scope=project, scope_id=proj-1`
- **THEN** the service uses the project-scoped config

#### Scenario: Falls back to platform config

- **WHEN** `generateText()` is called with `projectId: "proj-1"` and no `configId`
- **AND** no active config exists for that project scope
- **AND** an active platform-scoped config exists
- **THEN** the service uses the platform-scoped config

#### Scenario: No config found throws error

- **WHEN** `generateText()` is called and no matching config exists at any scope level
- **THEN** the service throws an error indicating no LLM is configured

### Requirement: Dynamic provider creation

`AiSdkLlmService` SHALL create AI SDK provider instances dynamically based on `LlmConfig.provider`:

- `"claude"` -> `createAnthropic()` from `@ai-sdk/anthropic`
- `"openai"` -> `createOpenAI()` from `@ai-sdk/openai`

The provider SHALL be configured with `apiKey` from `LlmConfig.api_key` and `baseURL` from `LlmConfig.base_url` (if set).

The model SHALL be selected using `LlmConfig.model` (e.g., `claude-sonnet-4-6`, `gpt-4o`).

#### Scenario: Unsupported provider throws error

- **WHEN** a `LlmConfig` record has an unrecognized `provider` value
- **THEN** the service throws an error indicating the provider is not supported

#### Scenario: Custom base URL is applied

- **WHEN** a `LlmConfig` has a non-null `base_url`
- **THEN** the provider instance is created with that base URL
