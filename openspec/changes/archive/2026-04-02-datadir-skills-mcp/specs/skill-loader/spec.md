## ADDED Requirements

### Requirement: Skill file format

A skill is a markdown file in `~/.openepis/skills/` with YAML frontmatter and a markdown body. The frontmatter SHALL support the following fields:

| Field          | Type   | Required | Description                                                       |
| -------------- | ------ | -------- | ----------------------------------------------------------------- |
| `name`         | string | yes      | Unique skill identifier                                           |
| `description`  | string | yes      | One-line description (used in logs and diagnostics)               |
| `requires_mcp` | string | no       | Name of the MCP server this skill depends on (key in `.mcp.json`) |

The markdown body contains instructions that are injected into the agent's system prompt.

#### Scenario: Valid skill file

- **GIVEN** a file `~/.openepis/skills/confluence.md` with valid frontmatter (`name`, `description`) and a markdown body
- **WHEN** the skill loader reads it
- **THEN** the skill is parsed successfully with name, description, and instruction text

#### Scenario: Missing required frontmatter

- **GIVEN** a skill file without `name` in the frontmatter
- **WHEN** the skill loader reads it
- **THEN** the file is skipped with a warning log (not a fatal error)

### Requirement: Skill loading from datadir

`@openepis/core` SHALL provide a skill loader that reads all `*.md` files from the `skills/` subdirectory of a given datadir path. The loader SHALL parse YAML frontmatter and extract the markdown body as instruction text. Skills with invalid frontmatter SHALL be skipped with a warning, not cause a fatal error.

#### Scenario: Multiple skills loaded

- **GIVEN** `skills/confluence.md` and `skills/jira.md` exist with valid frontmatter
- **WHEN** the skill loader runs
- **THEN** both skills are loaded and their instructions are available

#### Scenario: Empty skills directory

- **GIVEN** `skills/` exists but contains no `.md` files
- **WHEN** the skill loader runs
- **THEN** an empty list is returned (no error)

### Requirement: Skill instructions injected into system prompt

When building the system prompt, the agent SHALL append all loaded skill instructions after the core prompt sections. Each skill's instructions SHALL be wrapped with a header indicating the skill name.

#### Scenario: Skills augment system prompt

- **GIVEN** a loaded skill named "confluence" with instruction body text
- **WHEN** the system prompt is built
- **THEN** the prompt includes a section `## Skill: confluence` followed by the skill's instruction body

### Requirement: Skill MCP dependency validation

If a skill declares `requires_mcp: confluence`, the skill loader SHALL check whether a MCP server named `confluence` is configured. If not, the skill SHALL still be loaded (instructions injected) but a warning SHALL be logged indicating the MCP dependency is not satisfied and the skill's tools may not be available.

#### Scenario: MCP dependency satisfied

- **GIVEN** skill `confluence.md` with `requires_mcp: confluence` and `.mcp.json` has a `confluence` server
- **WHEN** skills are loaded
- **THEN** the skill is loaded without warnings

#### Scenario: MCP dependency not satisfied

- **GIVEN** skill `confluence.md` with `requires_mcp: confluence` but no `confluence` server in `.mcp.json`
- **WHEN** skills are loaded
- **THEN** the skill is loaded with a warning: `"Skill 'confluence' requires MCP server 'confluence' which is not configured"`
