## Why

MVP-0 includes a "Claude Code Skill" as a developer-facing integration point. Developers need to query BDD features, view feature details, and find context-relevant BDD from within their Claude Code workflow. The CLI (`@openepis/cli`) already implements these commands (`features`, `bdd`, `context`), so the skills should be thin wrappers that invoke the CLI and present results to Claude Code.

**Currently, skills under `.claude/skills/` are project-scoped — they only work inside the openepis monorepo.** These skills need to be usable by any developer in any project that connects to an OpenEpis server. The solution is to package skills as a **Claude Code plugin**, which can be distributed via a plugin marketplace, installed per-user, or loaded via `--plugin-dir`.

## What Changes

- Package the three developer-facing skills as a **Claude Code plugin** (`openepis-claude-plugin/`):
  - **`/openepis:features`** — list all BDD features in the project (wraps `openepis features`)
  - **`/openepis:bdd`** — view full BDD for a specific feature (wraps `openepis bdd <name|id>`)
  - **`/openepis:context`** — find BDD related to a source file (wraps `openepis context <file>`)
- Create plugin manifest (`.claude-plugin/plugin.json`) with proper metadata
- Each skill invokes the CLI via Bash, requiring `.openepis.json` config in the consuming repo root
- Skills are read-only — they query the API through the CLI, never modify data
- Plugin can be distributed via:
  - `claude --plugin-dir ./openepis-claude-plugin` (local testing)
  - Plugin marketplace (team or official Anthropic marketplace)
  - Git repository URL for `--plugin-dir` or marketplace entry

## Capabilities

### New Capabilities

- `openepis-plugin-manifest`: Plugin manifest and directory structure for distribution
- `claude-skill-features`: Skill definition for listing project BDD features via CLI
- `claude-skill-bdd`: Skill definition for viewing a specific feature's full BDD via CLI
- `claude-skill-context`: Skill definition for finding BDD related to source files via CLI

### Modified Capabilities

_(none — no existing spec requirements change)_

## Impact

- **New directory**: `openepis-claude-plugin/` at monorepo root, structured as a Claude Code plugin
  - `.claude-plugin/plugin.json` — plugin manifest
  - `skills/openepis-features/SKILL.md` — features skill
  - `skills/openepis-bdd/SKILL.md` — BDD detail skill
  - `skills/openepis-context/SKILL.md` — context skill
- **Dependencies**: Requires `@openepis/cli` installed globally (`npm i -g @openepis/cli`) or available via `npx`
- **Config**: Requires `.openepis.json` with `apiUrl` and `projectId` in the consuming repo
- **No API changes**: Skills consume existing REST endpoints through the CLI
- **Distribution**: Plugin can be shared via marketplace or `--plugin-dir` flag
