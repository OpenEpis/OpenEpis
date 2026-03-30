## ADDED Requirements

### Requirement: Find BDD context for source files via Claude Code plugin skill

The system SHALL provide a Claude Code plugin skill at `openepis-claude-plugin/skills/openepis-context/SKILL.md` that finds BDD features related to a source file by invoking the CLI command `openepis context <file>`.

The skill SHALL:

- Be invocable as `/openepis:openepis-context <file>` in Claude Code (when plugin is loaded)
- Accept a file path as argument, with optional `--repository` / `-r` flag
- Execute the CLI via `npx @openepis/cli context <file>` and present related features with relevance levels (HIGH/MED/LOW) and related scenario names
- Require `.openepis.json` in the consuming repo root

#### Scenario: Find context for a source file

- **WHEN** a developer invokes `/openepis:openepis-context src/pages/ProductDetail.tsx`
- **THEN** Claude executes the CLI and presents related BDD features grouped by relevance level, including related scenario names

#### Scenario: No related BDD found

- **WHEN** a developer invokes `/openepis:openepis-context` for a file with no related BDD features
- **THEN** the CLI reports no features found, and Claude communicates this to the developer

#### Scenario: Specify repository

- **WHEN** a developer invokes `/openepis:openepis-context src/api/auth.ts -r backend`
- **THEN** Claude executes the CLI scoping the query to the "backend" repository
