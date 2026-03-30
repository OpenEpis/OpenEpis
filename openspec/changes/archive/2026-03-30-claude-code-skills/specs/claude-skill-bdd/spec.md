## ADDED Requirements

### Requirement: View feature BDD detail via Claude Code plugin skill

The system SHALL provide a Claude Code plugin skill at `openepis-claude-plugin/skills/openepis-bdd/SKILL.md` that displays the full BDD for a specific feature by invoking the CLI command `openepis bdd <name|id>`.

The skill SHALL:

- Be invocable as `/openepis:openepis-bdd <feature>` in Claude Code (when plugin is loaded)
- Accept a feature name or ID as argument
- Execute the CLI via `npx @openepis/cli bdd <feature>` and present the full feature detail (title, status, version, description, scenarios with steps)
- Require `.openepis.json` in the consuming repo root

#### Scenario: View feature by name

- **WHEN** a developer invokes `/openepis:openepis-bdd "User Authentication"` in a repo with valid config and the plugin loaded
- **THEN** Claude executes the CLI and presents the feature's title, description, status, version, and all scenarios with their Given/When/Then steps

#### Scenario: Feature not found

- **WHEN** a developer invokes `/openepis:openepis-bdd "NonExistent"` and no feature matches
- **THEN** the CLI outputs an error, and Claude reports that no matching feature was found

#### Scenario: Multiple features match

- **WHEN** a developer invokes `/openepis:openepis-bdd "User"` and multiple features match the search
- **THEN** the CLI lists matching features with their IDs, and Claude presents these options to the developer
