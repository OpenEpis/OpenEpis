## ADDED Requirements

### Requirement: update_bdd tool result correctly populates pending_changes

The SSE message handler SHALL extract BDD changes from `event.result.details.changes` (not `event.result.details` directly) when processing `tool_execution_end` events for the `update_bdd` tool.

#### Scenario: update_bdd call produces valid bdd-change SSE event

- **WHEN** the agent calls `update_bdd` with new features
- **THEN** the `bdd-change` SSE event contains a `changes` object with `new_features` as an array of feature objects (not a number)

#### Scenario: pending_changes persisted after agent completes

- **WHEN** the agent completes a turn that included `update_bdd` calls
- **THEN** the conversation's `pending_changes` field contains properly structured `GeneratedChanges` with `new_features[].title`, `new_features[].scenarios[]`, etc.

### Requirement: new features in update_bdd have temp_id

Each new feature proposed through `update_bdd` SHALL have a `temp_id` (UUID) for client-side tracking. The server SHALL generate one if the LLM does not provide it.

#### Scenario: temp_id present on new features in bdd-change event

- **WHEN** the agent calls `update_bdd` with new features
- **THEN** each new feature in the `bdd-change` event's `changes.new_features` array has a non-empty `temp_id` string

### Requirement: tool_calls persisted on assistant messages

When converting Pi agent messages back to `ConversationMessage` format, assistant messages that contain `tool_use` blocks SHALL include the corresponding `tool_calls` array with tool name and arguments.

#### Scenario: assistant message contains tool_calls after update_bdd

- **WHEN** the agent calls `update_bdd` during a conversation turn
- **THEN** the persisted assistant message has `tool_calls` containing at least one entry with `name: "update_bdd"`

### Requirement: SSE error event on agent failure

When the agent encounters an error during processing, the server SHALL emit an `error` SSE event with a descriptive message.

#### Scenario: SSE stream includes error event on failure

- **WHEN** the agent fails during message processing
- **THEN** the SSE stream includes an event with `event: "error"` and `data.message` describing the failure
