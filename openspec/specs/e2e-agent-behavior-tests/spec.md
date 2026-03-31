## ADDED Requirements

### Requirement: Agent calls update_bdd with valid GeneratedChanges

The test suite SHALL verify that the BDD agent calls the `update_bdd` tool and produces a valid `GeneratedChanges` structure when asked to generate BDD.

#### Scenario: Agent generates new features with correct structure

- **WHEN** a message asking to generate BDD for a new capability is sent (e.g., "为用户收藏功能写BDD")
- **THEN** the SSE stream SHALL contain a `bdd-change` event
- **THEN** the `changes.new_features` array SHALL contain at least one entry
- **THEN** each new feature SHALL have a non-empty `title`, `description`, `temp_id`, and at least one scenario
- **THEN** each scenario SHALL have a non-empty `title` and `steps` array with valid BDD step types (`given`, `when`, `then`, `and`)

#### Scenario: Agent persists messages with tool_calls metadata

- **WHEN** the agent finishes processing and the `done` event is received
- **THEN** `GET /api/conversations/:id` SHALL return messages that include assistant messages with `tool_calls` array containing `{ name: "update_bdd", arguments: {...} }`

### Requirement: Agent uses context tools when existing features are present

The test suite SHALL verify that the agent uses `search_features` or `get_feature_detail` to gather context when the project has existing BDD features.

#### Scenario: Agent queries existing features before generating

- **WHEN** a project already has BDD features (e.g., a "User Login" feature)
- **THEN** when a message asking to modify or add related BDD is sent (e.g., "在已有的用户登录功能基础上，增加记住密码的场景")
- **THEN** the conversation messages after completion SHALL contain tool_calls with `search_features` or `get_feature_detail` names, demonstrating the agent retrieved context before proposing changes

### Requirement: Agent supports multi-turn conversation

The test suite SHALL verify that the agent can handle multi-turn conversations, refining BDD across messages.

#### Scenario: Multi-turn BDD refinement

- **WHEN** a first message generates initial BDD (e.g., "为购物车功能写BDD")
- **THEN** the conversation SHALL have pending_changes with new features
- **WHEN** a second message asks to refine (e.g., "再加一个场景：用户可以修改商品数量")
- **THEN** the pending_changes SHALL be updated (merged) to include the additional scenario
- **THEN** the conversation messages SHALL contain all 4 messages (2 user + 2 assistant)
