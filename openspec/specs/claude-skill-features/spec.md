## ADDED Requirements

### Requirement: List project BDD features via Claude Code plugin skill

The system SHALL provide a Claude Code plugin skill at `openepis-claude-plugin/skills/openepis-features/SKILL.md` that lists all BDD features in the current project by invoking the CLI command `openepis features`.

The skill SHALL:

- Be invocable as `/openepis:openepis-features` in Claude Code (when plugin is loaded)
- Execute the CLI via `npx @openepis/cli features` and present the output (feature titles, statuses, scenario counts, tags)
- Require `.openepis.json` in the consuming repo root with `apiUrl` and `projectId`

#### Scenario: Successfully list features

- **WHEN** a developer invokes `/openepis:openepis-features` in a repo with a valid `.openepis.json` and the plugin loaded
- **THEN** Claude executes the CLI and presents the feature list in the conversation

#### Scenario: No config file present

- **WHEN** a developer invokes `/openepis:openepis-features` in a repo without `.openepis.json`
- **THEN** the CLI outputs an error, and Claude instructs the user to create the config file with `apiUrl` and `projectId`

#### Scenario: Plugin not loaded

- **WHEN** a developer has not loaded the openepis plugin
- **THEN** the `/openepis:openepis-features` skill is not available in the skill list
