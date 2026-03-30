## MODIFIED Requirements

### Requirement: Lightweight DI container

The server SHALL have a DI container (`apps/server/src/container.ts`) that supports registering and resolving services by typed tokens. The container SHALL use lazy singleton instantiation — factories are called on first `resolve()`, and the instance is cached for subsequent calls.

The `TOKENS` object SHALL include `LlmService` in addition to `StorageService`. The `TokenMap` SHALL map `TOKENS.LlmService` to `ILlmService`.

#### Scenario: Container resolves registered service

- **WHEN** a factory is registered for `TOKENS.StorageService`
- **AND** `container.resolve(TOKENS.StorageService)` is called
- **THEN** the factory is invoked and returns the correct `IStorageService` instance

#### Scenario: Container resolves LlmService

- **WHEN** a factory is registered for `TOKENS.LlmService`
- **AND** `container.resolve(TOKENS.LlmService)` is called
- **THEN** the factory returns an `ILlmService` instance

### Requirement: Server composition root with DI

The server SHALL create a `Container` instance at startup, register `PostgresStorageService` as the `IStorageService` implementation, register `AiSdkLlmService` as the `ILlmService` implementation (wired with `storage.llmConfigs`), and pass the container to all route plugins.

#### Scenario: Server registers LlmService at startup

- **WHEN** the server starts
- **THEN** `AiSdkLlmService` is registered in the container with `storage.llmConfigs` as its dependency
- **AND** route plugins can resolve `TOKENS.LlmService` from the container
