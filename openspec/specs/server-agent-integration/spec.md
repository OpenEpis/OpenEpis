## ADDED Requirements

### Requirement: BddContextService adapter

The server SHALL implement `IBddContextService` (from `@openepis/core`) as an adapter over `IStorageService`, bridging the core agent's context needs with the database.

#### Scenario: Get feature detail via adapter

- **WHEN** the agent calls `get_feature_detail` tool with a valid feature ID
- **THEN** `BddContextServiceImpl` loads the Feature and its Scenarios from storage and returns a `FeatureDetail` object

#### Scenario: Search features via adapter

- **WHEN** the agent calls `search_features` tool with a query string
- **THEN** `BddContextServiceImpl` searches Features in the project by keyword and returns matching `FeatureSummary[]`

### Requirement: Agent lifecycle in message endpoint

The message endpoint SHALL create a BDD agent, subscribe to its events, stream SSE to the client, and persist results on completion. The full lifecycle: read DB state → build `BddAgentOptions` → create agent → subscribe → prompt → stream → persist.

#### Scenario: Agent creation with full context

- **WHEN** the server handles `POST /api/conversations/:id/messages`
- **THEN** it reads the conversation, project, LLM config, and feature index from the database, constructs `BddAgentOptions`, and calls `createBddAgent()`

#### Scenario: Pi Agent events mapped to SSE

- **WHEN** the agent emits `message_update` events
- **THEN** the server extracts text deltas and writes `text-delta` SSE events to the response stream

#### Scenario: update_bdd tool result captured

- **WHEN** the agent emits `tool_execution_end` for the `update_bdd` tool
- **THEN** the server calls `mergeChanges(conversation.pendingChanges, event.result)` and writes a `bdd-change` SSE event with the accumulated changes

#### Scenario: Agent completion persists state

- **WHEN** the agent emits `agent_end`
- **THEN** the server persists the updated `messages` array (including the new assistant message) and `pending_changes` to the conversation record, sends a `done` SSE event, and closes the stream

### Requirement: LLM config resolution for agent

The server SHALL read the active `LlmConfig` for the project (or platform default) and pass it to the agent as `ModelConfig`.

#### Scenario: Project-level LLM config

- **WHEN** a conversation belongs to a project with an active project-scoped LLM config
- **THEN** that config's provider, model, and API key are used for the agent

#### Scenario: Platform-level fallback

- **WHEN** no project-scoped LLM config exists
- **THEN** the platform-level active LLM config is used

#### Scenario: No LLM config available

- **WHEN** no active LLM config exists at any scope
- **THEN** the message endpoint returns HTTP 500 with error code `LLM_CONFIG_MISSING`

### Requirement: Feature index assembly

The server SHALL load the feature index (Layer 1: all Feature titles + descriptions for the project) before creating the agent.

#### Scenario: Assemble feature index

- **WHEN** the server prepares to create the agent
- **THEN** it loads all Features for the project via `storage.features.findByProject()` and maps them to `FeatureSummary[]` for the agent's `featureIndex` option

### Requirement: Apply changes transaction

The apply endpoint SHALL write all pending BDD changes to the database within a single transaction. If any write fails, all changes are rolled back.

#### Scenario: Transactional apply with mixed operations

- **WHEN** `pending_changes` contains both new features and modified features
- **THEN** all Feature/Scenario creates and updates happen within one transaction, and FeatureRevision records are created for each affected Feature

#### Scenario: Apply rollback on failure

- **WHEN** a database error occurs during apply (e.g., constraint violation)
- **THEN** no Features or Scenarios are created/modified and the endpoint returns HTTP 500 with the error
