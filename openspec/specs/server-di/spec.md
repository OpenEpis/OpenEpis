## ADDED Requirements

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

#### Scenario: Container returns same instance on repeated resolve

- **WHEN** `container.resolve(TOKENS.StorageService)` is called multiple times
- **THEN** the same instance is returned each time (singleton behavior)

#### Scenario: Container throws on unregistered token

- **WHEN** `container.resolve()` is called with a token that has no registration
- **THEN** an error is thrown

### Requirement: Server composition root with DI

The server SHALL create a `Container` instance at startup, register `PostgresStorageService` as the `IStorageService` implementation, register `AiSdkLlmService` as the `ILlmService` implementation (wired with `storage.llmConfigs`), and pass the container to all route plugins.

#### Scenario: Server starts and connects to database

- **WHEN** the server starts with a valid `DATABASE_URL` environment variable
- **THEN** `PostgresStorageService` is registered in the container and all route plugins receive the container

#### Scenario: Server registers LlmService at startup

- **WHEN** the server starts
- **THEN** `AiSdkLlmService` is registered in the container with `storage.llmConfigs` as its dependency
- **AND** route plugins can resolve `TOKENS.LlmService` from the container

#### Scenario: Route plugin resolves storage from container

- **WHEN** a route handler needs `IStorageService`
- **THEN** it calls `container.resolve(TOKENS.StorageService)` from the plugin options
- **AND** it does NOT import `PostgresStorageService` directly

#### Scenario: Server shuts down gracefully

- **WHEN** the server receives SIGTERM or SIGINT
- **THEN** it calls `container.dispose()` (which disconnects storage) and `app.close()` before exiting

### Requirement: Container is extensible for future services

The `Container` class and `TOKENS` map SHALL be designed so that new service tokens (e.g., for cache, queue, or other storage backends) can be added by extending the `TokenMap` type and adding new entries to `TOKENS`.

#### Scenario: Adding a new service token

- **WHEN** a new service interface needs to be registered
- **THEN** only `container.ts` needs to be updated (add token + type mapping)
- **AND** no changes are needed to the Container class itself

### Requirement: Remove tsyringe coupling from storage-pg

The `@openepis/storage-pg` package SHALL NOT depend on `tsyringe` or export any DI registration function. The `STORAGE_SERVICE` token SHALL be removed from `@openepis/storage`.

#### Scenario: storage-pg has no tsyringe dependency

- **WHEN** examining `packages/storage-pg/package.json`
- **THEN** `tsyringe` and `reflect-metadata` are not listed as dependencies

#### Scenario: storage-pg does not export registerPostgresStorage

- **WHEN** examining `packages/storage-pg/src/index.ts`
- **THEN** there is no export of `registerPostgresStorage` or `container`

#### Scenario: storage package does not export STORAGE_SERVICE token

- **WHEN** examining `packages/storage/src/index.ts`
- **THEN** there is no export of `STORAGE_SERVICE`
