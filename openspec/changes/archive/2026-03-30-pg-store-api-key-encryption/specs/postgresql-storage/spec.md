## MODIFIED Requirements

### Requirement: Drizzle schema for all tables

11 table schemas with types, FKs, constraints, indexes. The `llm_configs` table SHALL include a `provider_config` JSONB column (nullable, default `null`).

#### Scenario: Schema matches data model

- **WHEN** Drizzle schema is loaded
- **THEN** all tables match docs/data-model.md

#### Scenario: llm_configs includes provider_config

- **WHEN** the `llm_configs` Drizzle schema is inspected
- **THEN** it includes a `provider_config` column of type `jsonb`, nullable, defaulting to `null`

### Requirement: PostgresStorageService

Implements IStorageService with Drizzle queries. `PostgresLlmConfigStorage` SHALL accept a `CryptoService` instance for API key encryption/decryption.

#### Scenario: CRUD via Drizzle

- **WHEN** storage methods are called
- **THEN** Drizzle queries execute against PostgreSQL

#### Scenario: LlmConfig storage uses encryption

- **WHEN** `PostgresLlmConfigStorage` is instantiated
- **THEN** it requires both a `Database` and a `CryptoService` instance
