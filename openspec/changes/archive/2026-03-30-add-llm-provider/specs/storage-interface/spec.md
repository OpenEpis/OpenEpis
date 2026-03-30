## MODIFIED Requirements

### Requirement: IStorageService interface

Typed CRUD operations for all entities, entity-namespaced sub-interfaces, disconnect().

The `LlmConfig` entity type SHALL use `api_key: string | null` instead of `api_key_encrypted`.

#### Scenario: Interface exports are available

- **WHEN** a consumer imports from `@openepis/storage`
- **THEN** `IStorageService` type is available with `llmConfigs: ILlmConfigStorage`

#### Scenario: LlmConfig type uses api_key field

- **WHEN** a consumer imports `LlmConfig` from `@openepis/types`
- **THEN** the type has `api_key: string | null` (not `api_key_encrypted`)
