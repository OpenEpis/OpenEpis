## Context

The BDD agent (`@openepis/core`) uses `pi-agent-core` with hardcoded prompt templates and a fixed tool set. External integrations require code changes and rebuilds. The Claude Code ecosystem has proven the Skill + MCP pattern: skills provide prompt-level instructions, MCP provides tool execution. We adopt this pattern for OpenEpis.

## Goals / Non-Goals

**Goals:**

- Runtime `datadir` at `~/.openepis` with editable prompts, skills, and MCP config
- Server initializes datadir on first startup (copy defaults, create directories)
- Agent loads prompts from filesystem instead of TypeScript constants
- Agent loads skill instructions from `skills/*.md` and appends to system prompt
- MCP client manager connects to servers on startup, bridges tools to `AgentTool`
- Users can add Confluence/Jira/etc. by configuring `.mcp.json` + dropping a skill file

**Non-Goals:**

- Per-project MCP or skill configuration (global only for MVP)
- Prompt versioning or upgrade merging (MVP uses "never overwrite" strategy)
- Skill trigger matching based on keywords (MVP loads all skills into system prompt)
- MCP server authentication beyond env var token injection
- Dynamic hot-reload of skills/prompts during server runtime (requires restart)

## Decisions

### 1. Datadir location and resolution

**Choice**: Default to `~/.openepis`, overridable via `OPENEPIS_DATA_DIR` env var. Server resolves the path at startup and passes it to core as a string.

**Alternative**: XDG-compliant paths (`~/.config/openepis`, `~/.local/share/openepis`).

**Rationale**: Single directory is simpler. Cross-platform: `os.homedir()` works on Linux/macOS/Windows. XDG adds complexity without benefit for a server-side app.

### 2. Prompt files are plain markdown, not TypeScript

**Choice**: `~/.openepis/prompts/*.md` — plain markdown files loaded with `fs.readFile`. The `{projectName}` placeholder in `role.md` is the only variable substitution needed.

**Alternative**: Keep templates in TypeScript, load overrides from datadir.

**Rationale**: The whole point is that users can edit prompts without touching code. Markdown files are universally editable. Simple string replacement handles `{projectName}`.

### 3. Defaults live in `apps/server/defaults/prompts/`

**Choice**: Default prompt files are shipped with `apps/server` and copied to datadir on first startup. Core only reads from a given datadir path — it doesn't know about defaults.

**Alternative**: Defaults in `@openepis/core` with `"files": ["dist", "defaults"]`.

**Rationale**: "Initialize datadir" is a server startup responsibility, not a library concern. Core stays pure: it reads a path, returns prompts. Server handles bootstrap.

### 4. Skills are prompt-only markdown with YAML frontmatter

**Choice**: `~/.openepis/skills/*.md` with frontmatter (`name`, `description`, optional `requires_mcp`) and markdown body containing agent instructions. Skills do NOT define tool schemas — tools come from MCP servers.

**Alternative**: Skills that can define tool schemas and inline execute logic.

**Rationale**: Clean separation: skills = instructions (what to do), MCP = capabilities (how to do it). No arbitrary code execution risk. Aligns with Claude Code's model.

### 5. MCP client manager lives in `@openepis/core`

**Choice**: `packages/core/src/mcp/` contains config parsing, client lifecycle management, and AgentTool bridging. Depends on `@modelcontextprotocol/sdk`.

**Alternative**: MCP logic in `apps/server` — core only receives pre-bridged tools.

**Rationale**: The MCP-to-AgentTool bridge is tightly coupled to core's `AgentTool` type and `pi-agent-core`. Putting it in core keeps the bridge logic co-located with the type it targets. Server only manages lifecycle (init/shutdown).

### 6. MCP Tool → AgentTool bridging uses `Type.Unsafe()`

**Choice**: MCP tool `inputSchema` (JSON Schema) is wrapped with TypeBox's `Type.Unsafe()` to satisfy the `AgentTool<TParameters extends TSchema>` generic. No JSON Schema → TypeBox conversion.

**Alternative**: Build a JSON Schema to TypeBox converter.

**Rationale**: `pi-agent-core` serializes the schema to JSON for LLM function calling — it doesn't validate with TypeBox at runtime. `Type.Unsafe()` passes through the original JSON Schema unchanged, which is exactly what the LLM needs.

### 7. MCP servers start with the server, not on-demand

**Choice**: All MCP servers in `.mcp.json` are connected during server startup. Connections are shared across all conversations.

**Alternative**: Lazy connect on first conversation that needs a tool.

**Rationale**: Server-side context (not a CLI). Cold start latency in a conversation is unacceptable. MCP connections are lightweight (stdio pipe or HTTP). Server shutdown closes all connections.

### 8. Environment variable expansion in `.mcp.json`

**Choice**: `${VAR}` and `${VAR:-default}` syntax in `env` values, expanded from `process.env` at config parse time. Same convention as Claude Code's `.mcp.json`.

**Alternative**: Direct env var references without expansion.

**Rationale**: Keeps secrets out of the config file. Users familiar with Claude Code already know this pattern.

## Risks / Trade-offs

- **[Risk] Prompts diverge after upgrades** — MVP uses "never overwrite" strategy. Users miss prompt improvements. Acceptable for now; add version-stamped merge hints later.
- **[Risk] MCP server process leaks** — If a stdio MCP server crashes, the client manager must detect and log it. Not auto-restart in MVP.
- **[Risk] `@modelcontextprotocol/sdk` adds dependency weight to core** — Acceptable trade-off for ecosystem compatibility. The SDK is well-maintained by Anthropic.
- **[Trade-off] All skills loaded into system prompt** — Token overhead scales with skill count. Acceptable for MVP (few skills). Add trigger-based filtering later.
- **[Trade-off] Global-only MCP config** — Different projects can't have different integrations. Acceptable for MVP; per-project config is a natural follow-up.
