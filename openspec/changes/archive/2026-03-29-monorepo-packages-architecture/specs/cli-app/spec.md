## ADDED Requirements

### Requirement: CLI entry point

The `@openepis/cli` app SHALL provide a `openepis` command with subcommands. It SHALL use `@openepis/sdk` for all API communication.

#### Scenario: Run without arguments

- **WHEN** the user runs `openepis` without arguments
- **THEN** it SHALL display help text listing available commands

### Requirement: Configuration

The CLI SHALL read configuration from a `.openepis.json` file in the current directory or ancestor directories. The config file SHALL contain `apiUrl` (string) and `projectId` (string).

#### Scenario: Config file found

- **WHEN** `.openepis.json` exists with `{ "apiUrl": "http://localhost:3000", "projectId": "uuid" }`
- **THEN** the CLI SHALL use those values for SDK initialization

#### Scenario: Config file not found

- **WHEN** no `.openepis.json` exists in the directory tree
- **THEN** the CLI SHALL print an error message and exit with code 1

### Requirement: List features command

The CLI SHALL provide `openepis features` to list all features in the configured project.

#### Scenario: List features

- **WHEN** the user runs `openepis features`
- **THEN** it SHALL display a table of features with title, status, scenario count, and tags

### Requirement: View BDD command

The CLI SHALL provide `openepis bdd <feature>` to display the full BDD for a feature.

#### Scenario: View feature by name

- **WHEN** the user runs `openepis bdd "User Authentication"`
- **THEN** it SHALL display the feature title, description, and all scenarios with their steps

### Requirement: Context query command

The CLI SHALL provide `openepis context <file>` to find BDD related to a source file.

#### Scenario: Query context

- **WHEN** the user runs `openepis context src/pages/ProductDetail.tsx`
- **THEN** it SHALL display related features and scenarios with relevance indicators
