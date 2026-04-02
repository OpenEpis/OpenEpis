## 1. Datadir Infrastructure

- [x] 1.1 Create `packages/core/src/datadir/index.ts` with `resolveDataDir()` function: reads `OPENEPIS_DATA_DIR` env var, falls back to `~/.openepis`, returns absolute path
- [x] 1.2 Create `packages/core/src/datadir/prompt-loader.ts` with `loadPrompts(datadirPath)`: reads `role.md`, `bdd-format.md`, `tool-usage.md`, `conversation.md` from `<datadir>/prompts/`, performs `{projectName}` substitution, throws on missing files
- [x] 1.3 Create `packages/core/src/datadir/skill-loader.ts` with `loadSkills(datadirPath)`: reads all `*.md` from `<datadir>/skills/`, parses YAML frontmatter (name, description, requires_mcp), returns array of `{ name, description, requiresMcp?, instructions }`. Skips files with invalid frontmatter with a warning
- [x] 1.4 Add `gray-matter` dependency to `@openepis/core` for YAML frontmatter parsing

## 2. Default Prompts & Server Bootstrap

- [x] 2.1 Create `apps/server/defaults/prompts/` with 4 markdown files extracted from current `templates.ts` constants: `role.md`, `bdd-format.md`, `tool-usage.md`, `conversation.md`
- [x] 2.2 Create `apps/server/src/datadir-init.ts` with `initDataDir(datadirPath, defaultsPath)`: ensures `<datadir>`, `<datadir>/prompts/`, `<datadir>/skills/` exist; copies defaults into `prompts/` only if directory was just created (not if it already existed)
- [x] 2.3 Wire datadir initialization into `apps/server/src/index.ts`: call `initDataDir()` before Fastify startup, register datadir path in the DI container

## 3. MCP Client Integration

- [x] 3.1 Add `@modelcontextprotocol/sdk` dependency to `@openepis/core`
- [x] 3.2 Create `packages/core/src/mcp/config.ts` with `parseMcpConfig(datadirPath)`: reads `<datadir>/.mcp.json`, parses JSON, expands `${VAR}` and `${VAR:-default}` in env values from `process.env`. Returns parsed config or null if file doesn't exist
- [x] 3.3 Create `packages/core/src/mcp/bridge.ts` with `bridgeMcpTool(mcpTool, mcpClient, serverName)`: converts an MCP tool definition to `AgentTool` using `Type.Unsafe()` for parameters and `mcpClient.callTool()` for execute. Namespaces tool name as `<server>__<tool>`
- [x] 3.4 Create `packages/core/src/mcp/client-manager.ts` with `McpClientManager` class: `init(config)` connects to all servers (stdio via `StdioClientTransport`, http via `StreamableHTTPClientTransport`), calls `listTools()`, bridges tools. `getTools()` returns all bridged `AgentTool[]`. `shutdown()` closes all connections. Failed servers log warning and continue
- [x] 3.5 Wire MCP manager into `apps/server/src/index.ts`: init after datadir, register in container, shutdown on SIGTERM/SIGINT

## 4. Agent Refactoring

- [x] 4.1 Refactor `buildSystemPrompt()` in `packages/core/src/prompt/system-prompt.ts`: accept prompt strings loaded from files (instead of importing from `templates.ts`), append skill instructions as `## Skill: <name>` sections
- [x] 4.2 Update `BddAgentOptions` in `packages/core/src/types.ts`: add optional `externalTools?: AgentTool[]` and `skillInstructions?: Array<{ name: string; instructions: string }>`
- [x] 4.3 Update `createBddAgent()` in `packages/core/src/agent.ts`: merge `externalTools` into the tools array, pass skill instructions to `buildSystemPrompt()`
- [x] 4.4 Update `apps/server/src/routes/conversations.ts`: resolve datadir, load prompts and skills, get MCP tools from container, pass all to `createBddAgent()`
- [x] 4.5 Remove `packages/core/src/prompt/templates.ts` after all references are migrated
- [x] 4.6 Update `packages/core/src/index.ts` exports: add `resolveDataDir`, `loadPrompts`, `loadSkills`, `McpClientManager`, `parseMcpConfig`

## 5. Validation & Skill MCP Dependency Check

- [x] 5.1 Add validation in skill loader: if a skill declares `requires_mcp`, check against the list of configured MCP server names and log a warning if not satisfied
- [x] 5.2 Build the project (`pnpm build`) and verify TypeScript compilation passes

## 6. E2E Tests

Tests go in `tests/e2e/api/` following existing Playwright Test patterns with `data-fixtures.ts`.

### 6.1 Datadir initialization

- [x] 6.1.1 Create `tests/e2e/api/datadir.spec.ts`: test that the server starts successfully and the health endpoint returns ok (validates datadir bootstrap didn't break startup)
- [x] 6.1.2 Test that prompts are loaded from datadir: send a conversation message and verify the agent responds (proves prompts were loaded from `~/.openepis/prompts/` rather than the deleted `templates.ts`)

### 6.2 Skills loading

- [x] 6.2.1 Create a test skill file in a temporary datadir `skills/test-greeting.md` with frontmatter (`name: test-greeting`) and instructions telling the agent to always start responses with "SKILL_LOADED"
- [x] 6.2.2 Test that skill instructions are injected: send a conversation message and verify the agent response includes the skill's marker text (proves skill instructions reached the system prompt)
- [x] 6.2.3 Test with empty skills directory: server starts normally, agent responds without skill-specific behavior

### 6.3 MCP tool bridging

- [x] 6.3.1 Create a minimal test MCP server (`tests/e2e/fixtures/echo-mcp-server.ts`): a stdio MCP server using `@modelcontextprotocol/sdk` that exposes a single tool `echo` which returns its input as text. This is a self-contained test fixture, not a production dependency
- [x] 6.3.2 Create `tests/e2e/api/mcp.spec.ts`: configure `.mcp.json` in a temporary datadir pointing to the echo MCP server
- [x] 6.3.3 Test that MCP tools are bridged: send a conversation message asking the agent to use the echo tool, verify the agent calls it and incorporates the result (proves MCP tool discovery + bridging + execution works end-to-end)
- [x] 6.3.4 Test server starts without `.mcp.json`: no MCP servers configured, agent works normally with only core tools

### 6.4 Skill + MCP integration

- [x] 6.4.1 Test skill with `requires_mcp` satisfied: create a skill referencing the echo MCP server, verify the agent uses the MCP tool as instructed by the skill
- [x] 6.4.2 Test skill with `requires_mcp` not satisfied: create a skill referencing a non-existent MCP server, verify the server starts with a warning (check server logs) and the agent still loads the skill instructions

### 6.5 Regression

- [x] 6.5.1 Verify existing conversation e2e tests still pass: BDD generation, apply/discard, multi-turn — confirming the datadir migration didn't break existing behavior
