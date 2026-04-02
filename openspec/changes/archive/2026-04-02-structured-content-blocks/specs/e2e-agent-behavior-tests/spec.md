## MODIFIED Requirements

### Requirement: Agent calls update_bdd with valid GeneratedChanges

The test suite SHALL verify that the BDD agent calls the `update_bdd` tool and produces a valid `GeneratedChanges` structure when asked to generate BDD. Tool call assertions SHALL use content blocks instead of the `tool_calls` field.

#### Scenario: Agent generates new features with correct structure

- **WHEN** a message asking to generate BDD for a new capability is sent
- **THEN** the SSE stream SHALL contain a `bdd-change` event
- **THEN** the `changes.new_features` array SHALL contain at least one entry
- **THEN** each new feature SHALL have a non-empty `title`, `description`, `temp_id`, and at least one scenario
- **THEN** each scenario SHALL have a non-empty `title` and `steps` array with valid BDD step types (`given`, `when`, `then`, `and`)

#### Scenario: Agent persists messages with tool_use content blocks

- **WHEN** the agent finishes processing and the `done` event is received
- **THEN** `GET /api/conversations/:id` SHALL return messages where assistant messages contain `content` blocks with `{ type: "tool_use", name: "update_bdd", arguments: {...} }` (not a separate `tool_calls` field)

### Requirement: Agent uses context tools when existing features are present

The test suite SHALL verify that the agent uses `search_features` or `get_feature_detail` to gather context when the project has existing BDD features. Assertions SHALL check for `tool_use` content blocks instead of `tool_calls`.

#### Scenario: Agent queries existing features before generating

- **WHEN** a project already has BDD features (e.g., a "User Login" feature)
- **THEN** when a message asking to modify or add related BDD is sent
- **THEN** the conversation messages after completion SHALL contain assistant messages with `content` blocks of `{ type: "tool_use" }` with `name` of `search_features` or `get_feature_detail`, demonstrating the agent retrieved context before proposing changes

### Requirement: Agent supports multi-turn conversation

The test suite SHALL verify that the agent can handle multi-turn conversations, refining BDD across messages. All message assertions SHALL use `ContentBlock[]` content shape.

#### Scenario: Multi-turn BDD refinement

- **WHEN** a first message generates initial BDD
- **THEN** the conversation SHALL have pending_changes with new features
- **WHEN** a second message asks to refine
- **THEN** the pending_changes SHALL be updated (merged) to include the additional scenario
- **THEN** the conversation messages SHALL contain all messages (user, assistant, and tool_result) with `content` as `ContentBlock[]` arrays
