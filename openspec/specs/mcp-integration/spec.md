## ADDED Requirements

### Requirement: MCP configuration file format

The system SHALL read MCP server configuration from `~/.openepis/.mcp.json`. The file format SHALL follow the Claude Code `.mcp.json` convention:

```json
{
  "mcpServers": {
    "<server-name>": {
      "transport": "stdio",
      "command": "<executable>",
      "args": ["<arg1>", "<arg2>"],
      "env": {
        "KEY": "${ENV_VAR}",
        "KEY2": "${ENV_VAR:-default_value}"
      }
    }
  }
}
```

Supported transport types: `stdio` (spawn subprocess), `http` (connect to remote URL via Streamable HTTP).

#### Scenario: stdio server configuration

- **GIVEN** `.mcp.json` with a stdio server `"confluence": { "transport": "stdio", "command": "npx", "args": ["-y", "@anthropic/mcp-confluence"] }`
- **WHEN** the config is parsed
- **THEN** the server is configured to spawn `npx -y @anthropic/mcp-confluence` as a subprocess

#### Scenario: http server configuration

- **GIVEN** `.mcp.json` with an HTTP server `"custom": { "transport": "http", "url": "http://localhost:3001/mcp" }`
- **WHEN** the config is parsed
- **THEN** the server is configured to connect via Streamable HTTP to the given URL

#### Scenario: No .mcp.json file

- **GIVEN** `~/.openepis/.mcp.json` does not exist
- **WHEN** the server starts
- **THEN** no MCP servers are connected (no error, zero MCP tools available)

### Requirement: Environment variable expansion

The MCP config parser SHALL expand `${VAR}` references in `env` values using `process.env`. The syntax `${VAR:-default}` SHALL use `default` when `VAR` is not set. Expansion SHALL only apply to values in the `env` object, not to `command`, `args`, or `url`.

#### Scenario: Env var exists

- **GIVEN** `env: { "TOKEN": "${CONFLUENCE_TOKEN}" }` and `process.env.CONFLUENCE_TOKEN = "abc123"`
- **WHEN** the config is parsed
- **THEN** the env value resolves to `"abc123"`

#### Scenario: Env var missing with default

- **GIVEN** `env: { "TOKEN": "${CONFLUENCE_TOKEN:-fallback}" }` and `CONFLUENCE_TOKEN` is not set
- **WHEN** the config is parsed
- **THEN** the env value resolves to `"fallback"`

#### Scenario: Env var missing without default

- **GIVEN** `env: { "TOKEN": "${CONFLUENCE_TOKEN}" }` and `CONFLUENCE_TOKEN` is not set
- **WHEN** the config is parsed
- **THEN** the env value resolves to `""` (empty string)

### Requirement: MCP client lifecycle management

The MCP client manager SHALL connect to all configured MCP servers during server startup. For `stdio` transport, it SHALL spawn the subprocess and connect via `StdioClientTransport`. For `http` transport, it SHALL connect via `StreamableHTTPClientTransport`. On server shutdown, the manager SHALL close all client connections and terminate spawned subprocesses.

#### Scenario: Successful startup with MCP servers

- **GIVEN** `.mcp.json` configures two servers: `confluence` (stdio) and `jira` (http)
- **WHEN** the server starts
- **THEN** both MCP clients connect successfully and their tools are available

#### Scenario: MCP server fails to connect

- **GIVEN** a configured stdio MCP server whose command does not exist
- **WHEN** the server starts
- **THEN** the failed server is logged as a warning; the server continues starting; other MCP servers still connect; the failed server's tools are not available

#### Scenario: Server shutdown

- **WHEN** the server receives SIGTERM
- **THEN** all MCP client connections are closed before the process exits

### Requirement: MCP Tool to AgentTool bridging

The MCP bridge SHALL convert each MCP tool (from `listTools()`) into a `pi-agent-core` `AgentTool`. The mapping SHALL be:

| MCP Tool field | AgentTool field | Conversion                                      |
| -------------- | --------------- | ----------------------------------------------- |
| `name`         | `name`          | Direct copy                                     |
| `name`         | `label`         | Direct copy                                     |
| `description`  | `description`   | Direct copy (empty string if null)              |
| `inputSchema`  | `parameters`    | Wrapped with `Type.Unsafe()` from TypeBox       |
| —              | `execute`       | Calls `mcpClient.callTool({ name, arguments })` |

The `execute` implementation SHALL call the MCP client's `callTool` method and convert the MCP result content into `AgentToolResult` format. Text content items SHALL be passed through. Non-text content (images, etc.) SHALL be filtered out in MVP.

#### Scenario: MCP tool bridged to AgentTool

- **GIVEN** an MCP server exposes a tool `read_page` with description and input schema
- **WHEN** tools are bridged
- **THEN** an `AgentTool` named `read_page` is available with the same description, and calling `execute()` invokes the MCP server's tool

#### Scenario: MCP tool execution returns text

- **GIVEN** a bridged MCP tool that returns `[{ type: "text", text: "page content..." }]`
- **WHEN** the agent calls the tool
- **THEN** the `AgentToolResult.content` contains `[{ type: "text", text: "page content..." }]`

### Requirement: Tool namespacing

MCP tools SHALL be namespaced with their server name to avoid collisions with core tools or tools from other MCP servers. The naming convention SHALL be `<server>__<tool>` (double underscore separator). For example, a `read_page` tool from the `confluence` server becomes `confluence__read_page`.

#### Scenario: No name collision

- **GIVEN** core tool `search_features` and MCP server `confluence` with tool `search_features`
- **WHEN** tools are assembled
- **THEN** the MCP tool is named `confluence__search_features`, distinct from the core `search_features`
