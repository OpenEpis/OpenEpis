## Why

The BDD agent currently has hardcoded prompt templates in TypeScript and a fixed set of 3 tools. Users cannot customize prompts without rebuilding, and the agent cannot integrate with external services (Confluence, Jira, etc.) to fetch context for BDD generation. We need:

1. **Editable prompts** — PMs and operators should be able to tweak agent behavior without code changes
2. **Extensible tools via MCP** — external integrations (Confluence, Jira, Notion) should plug in via the standard MCP protocol, leveraging the existing ecosystem of MCP servers
3. **Skills** — markdown instruction files that tell the agent how and when to use MCP-provided tools

## What Changes

- Introduce a runtime `datadir` concept at `~/.openepis` (configurable via `OPENEPIS_DATA_DIR` env var)
- On first startup, copy default prompt templates from `apps/server/defaults/prompts/` to `~/.openepis/prompts/`
- Load prompt templates from `datadir` at runtime instead of importing from TypeScript constants
- Load skill instruction files from `~/.openepis/skills/*.md` and inject them into the agent's system prompt
- Read `~/.openepis/.mcp.json` on server startup, connect to configured MCP servers, and bridge their tools into the agent as `AgentTool` instances
- Refactor `createBddAgent()` to accept external tools and skill instructions alongside core tools

## Capabilities

### New Capabilities

- `datadir`: Runtime data directory (`~/.openepis`) with initialization, prompt loading, and skill loading
- `skill-loader`: Parse skill markdown files (YAML frontmatter + body) and provide instructions for system prompt injection
- `mcp-integration`: MCP client manager that connects to servers defined in `.mcp.json`, discovers tools via `listTools()`, and bridges them to `AgentTool` interface

### Modified Capabilities

- `server-agent-integration`: Server startup initializes datadir and MCP clients; `createBddAgent()` receives external tools and skill instructions
- Prompt templates: moved from `packages/core/src/prompt/templates.ts` (hardcoded) to `~/.openepis/prompts/*.md` (editable files)

## Impact

- **Code**: `packages/core/src/` — new `datadir/`, `mcp/` modules; refactored `prompt/`, `agent.ts`. `apps/server/src/` — new `defaults/prompts/`, startup initialization, container changes
- **Dependencies**: `@modelcontextprotocol/sdk` added to `@openepis/core`; `gray-matter` (or similar) for YAML frontmatter parsing
- **Runtime**: Requires `~/.openepis` directory (auto-created). Optional `.mcp.json` for MCP server configuration
- **API**: No external API changes. Agent behavior is the same by default; new capabilities are opt-in via datadir configuration
