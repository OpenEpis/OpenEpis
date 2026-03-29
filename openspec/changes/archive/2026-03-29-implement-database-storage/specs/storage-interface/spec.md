## ADDED Requirements

### Requirement: Pure interface package with no DB dependencies

`@openepis/storage` SHALL contain only TypeScript interfaces, utility types, and DI tokens.

#### Scenario: Package has no DB runtime dependencies

- **WHEN** `@openepis/storage` is installed
- **THEN** its dependencies do not include any database-specific package

### Requirement: IStorageService interface

Typed CRUD operations for all entities, entity-namespaced sub-interfaces, disconnect().

#### Scenario: Interface exports are available

- **WHEN** a consumer imports from `@openepis/storage`
- **THEN** `IStorageService` type and `STORAGE_SERVICE` token are available

### Requirement: TSyringe injection token

STORAGE_SERVICE symbol token for DI.

#### Scenario: Injecting storage service

- **WHEN** `@inject(STORAGE_SERVICE)` is used
- **THEN** TSyringe resolves to the registered implementation
