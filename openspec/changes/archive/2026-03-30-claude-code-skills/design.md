## Context

MVP-0 includes a Claude Code Skill as a developer-facing integration. The CLI (`@openepis/cli`) already implements three commands — `features`, `bdd`, and `context` — that query the OpenEpis REST API via `@openepis/sdk`. These commands read `.openepis.json` from the repo root for API URL and project ID.

Claude Code supports a **plugin system** for distributing skills across projects and users. A plugin is a directory with `.claude-plugin/plugin.json` (manifest) and `skills/<name>/SKILL.md` files. Plugin skills are namespaced as `/plugin-name:skill-name`. Plugins can be loaded via `--plugin-dir`, installed from a marketplace, or distributed as a git repository.

## Goals / Non-Goals

**Goals:**

- Package skills as a Claude Code plugin (`openepis`) so they can be distributed to any user/project
- Provide `/openepis:features`, `/openepis:bdd`, and `/openepis:context` as plugin skills
- Each skill delegates to the CLI, keeping skill definitions thin
- Output is formatted for Claude to understand and use as development context
- Skills work in any repo that has `.openepis.json` configured and `@openepis/cli` available
- Plugin can be installed via marketplace or loaded with `--plugin-dir`

**Non-Goals:**

- No write operations (no creating/editing features from skills)
- No direct API calls from skills — always go through CLI
- No authentication handling (MVP-0 has no auth enforcement)
- No `/openepis:diff` skill (mentioned in docs but not implemented in CLI yet)
- No MCP server in the plugin (may be added later)

## Decisions

### Decision 1: Package as a Claude Code plugin, not project-scoped `.claude/skills/`

**Rationale**: Project-scoped skills (`.claude/skills/`) only work inside the repo where they live. OpenEpis skills need to be usable by any developer in any project that connects to an OpenEpis server. The plugin system provides:

- Namespace isolation (`/openepis:*`)
- Distribution via marketplace or `--plugin-dir`
- Independence from the consuming project's `.claude/` directory

**Alternative considered**: Personal skills at `~/.claude/skills/` — rejected because they require manual setup per user and aren't version-controlled or distributable.

### Decision 2: Plugin directory at monorepo root (`openepis-claude-plugin/`)

**Rationale**: The plugin is a distributable artifact, not part of any single app. Placing it at the monorepo root makes it easy to develop alongside the CLI while keeping it as an independent, self-contained directory that can be published separately.

**Alternative considered**: Inside `apps/` — rejected because the plugin is not a Node.js app; it's a collection of markdown files with a JSON manifest.

### Decision 3: Invoke CLI via `npx @openepis/cli` for external consumers

**Rationale**: When the plugin is used outside the monorepo, the CLI must be available as an npm package. `npx @openepis/cli` ensures it works without global installation. For monorepo development, skills can alternatively use `pnpm --filter @openepis/cli exec openepis`.

**Alternative considered**: Require global CLI install — rejected because it adds friction for first-time users.

### Decision 4: One skill per command, not a single combined skill

**Rationale**: Claude Code skills map to slash commands. Separate skills (`/openepis:features`, `/openepis:bdd`, `/openepis:context`) are more discoverable and each has distinct arguments. A single `/openepis` skill with sub-commands would require argument parsing in the prompt.

### Decision 5: Skills output raw CLI text, Claude interprets

**Rationale**: The CLI already formats output for terminal readability (tables, badges). Claude can parse this text. No need for `--json` output mode in skills since the text format carries the same information and is more readable in conversation.

## Plugin Structure

```
openepis-claude-plugin/
├── .claude-plugin/
│   └── plugin.json            # Plugin manifest
├── skills/
│   ├── openepis-features/
│   │   └── SKILL.md           # /openepis:openepis-features
│   ├── openepis-bdd/
│   │   └── SKILL.md           # /openepis:openepis-bdd
│   └── openepis-context/
│       └── SKILL.md           # /openepis:openepis-context
└── README.md                  # Usage instructions for consumers
```

Plugin manifest (`plugin.json`):

```json
{
  "name": "openepis",
  "description": "Query BDD features and context from OpenEpis within Claude Code",
  "version": "0.1.0",
  "author": { "name": "OpenEpis" },
  "repository": { "type": "git", "url": "https://github.com/openepis/openepis" },
  "homepage": "https://github.com/openepis/openepis"
}
```

With plugin name `"openepis"`, skills are invoked as:

- `/openepis:openepis-features`
- `/openepis:openepis-bdd`
- `/openepis:openepis-context`

## Risks / Trade-offs

- **[CLI not published to npm]** → Plugin won't work outside the monorepo until `@openepis/cli` is published. Mitigation: document `--plugin-dir` usage for monorepo development; plan npm publish as a separate task.
- **[Missing .openepis.json]** → CLI exits with a clear error message. Skills can instruct the user to create the config file.
- **[Server not running]** → Network errors from CLI. Mitigation: skill output should mention checking that the API server is running if the command fails.
- **[Plugin marketplace not set up]** → Initial distribution is via `--plugin-dir` or manual copy. Marketplace publishing is a future step.
