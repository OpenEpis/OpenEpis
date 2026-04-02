## ADDED Requirements

### Requirement: Datadir path resolution

The system SHALL resolve the datadir path as follows: if `OPENEPIS_DATA_DIR` environment variable is set, use its value; otherwise use `~/.openepis` (resolved via `os.homedir()`). The resolved path SHALL be an absolute path.

#### Scenario: Default path

- **WHEN** `OPENEPIS_DATA_DIR` is not set
- **THEN** the datadir resolves to `<homedir>/.openepis`

#### Scenario: Custom path via env var

- **WHEN** `OPENEPIS_DATA_DIR` is set to `/data/openepis`
- **THEN** the datadir resolves to `/data/openepis`

### Requirement: Datadir initialization on server startup

On server startup, the server SHALL ensure the datadir structure exists. If `~/.openepis` does not exist, it SHALL be created. If `~/.openepis/prompts/` does not exist, the server SHALL copy the default prompt files from `apps/server/defaults/prompts/` into it. If `~/.openepis/prompts/` already exists, it SHALL NOT be overwritten. The server SHALL ensure `~/.openepis/skills/` directory exists (create if missing).

#### Scenario: First startup (clean state)

- **WHEN** `~/.openepis` does not exist
- **THEN** the directory is created with `prompts/` (populated from defaults) and `skills/` (empty)

#### Scenario: Subsequent startup (prompts exist)

- **WHEN** `~/.openepis/prompts/` already contains files
- **THEN** existing files are preserved, no files are overwritten or added

#### Scenario: Partial state (prompts missing, skills exists)

- **WHEN** `~/.openepis` exists but `prompts/` is missing
- **THEN** `prompts/` is created and populated from defaults; `skills/` is unchanged

### Requirement: Prompt loading from datadir

`@openepis/core` SHALL provide a prompt loader that reads `*.md` files from the `prompts/` subdirectory of a given datadir path. The loader SHALL read the following files: `role.md`, `bdd-format.md`, `tool-usage.md`, `conversation.md`. The loader SHALL perform `{projectName}` variable substitution in `role.md`. If a prompt file is missing, the loader SHALL throw an error with a clear message indicating which file is missing.

#### Scenario: All prompts present

- **WHEN** all 4 prompt files exist in `datadir/prompts/`
- **THEN** `buildSystemPrompt()` returns a system prompt assembled from these files (with variable substitution applied)

#### Scenario: Prompt file missing

- **WHEN** `role.md` is missing from `datadir/prompts/`
- **THEN** the loader throws an error: `"Missing prompt file: role.md in <datadir>/prompts/"`

### Requirement: Default prompt files

`apps/server/defaults/prompts/` SHALL contain 4 markdown files with the same content as the current `templates.ts` constants:

| File              | Source constant           |
| ----------------- | ------------------------- |
| `role.md`         | `ROLE_TEMPLATE`           |
| `bdd-format.md`   | `BDD_FORMAT_INSTRUCTIONS` |
| `tool-usage.md`   | `TOOL_USAGE_GUIDANCE`     |
| `conversation.md` | `CONVERSATION_GUIDANCE`   |

These files are the source of truth for default prompts. `templates.ts` SHALL be removed after migration.
