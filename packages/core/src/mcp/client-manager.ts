import type { AgentTool } from "@mariozechner/pi-agent-core";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { McpConfig, McpServerConfig } from "./config.js";
import { bridgeMcpTool } from "./bridge.js";

interface ConnectedServer {
  name: string;
  client: Client;
  transport: StdioClientTransport | StreamableHTTPClientTransport;
}

export class McpClientManager {
  private servers: ConnectedServer[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tools: AgentTool<any>[] = [];

  /**
   * Connect to all MCP servers defined in the config.
   * Failed servers log a warning and are skipped.
   */
  async init(config: McpConfig): Promise<void> {
    for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
      try {
        await this.connectServer(name, serverConfig);
      } catch (err) {
        console.warn(
          `[mcp] Failed to connect to server '${name}': ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  private async connectServer(name: string, config: McpServerConfig): Promise<void> {
    const client = new Client({ name: `openepis-${name}`, version: "1.0.0" });

    let transport: StdioClientTransport | StreamableHTTPClientTransport;

    if (config.transport === "stdio") {
      if (!config.command)
        throw new Error(`MCP server '${name}': stdio transport requires 'command'`);
      transport = new StdioClientTransport({
        command: config.command,
        args: config.args ?? [],
        env: { ...process.env, ...(config.env ?? {}) } as Record<string, string>,
      });
    } else if (config.transport === "http") {
      if (!config.url) throw new Error(`MCP server '${name}': http transport requires 'url'`);
      transport = new StreamableHTTPClientTransport(new URL(config.url));
    } else {
      throw new Error(`MCP server '${name}': unsupported transport '${config.transport}'`);
    }

    await client.connect(transport);

    // Discover tools
    const { tools: mcpTools } = await client.listTools();
    for (const mcpTool of mcpTools) {
      this.tools.push(bridgeMcpTool(mcpTool, client, name));
    }

    this.servers.push({ name, client, transport });
    console.log(`[mcp] Connected to server '${name}' — ${mcpTools.length} tool(s)`);
  }

  /** Get all bridged AgentTools from all connected servers. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getTools(): AgentTool<any>[] {
    return this.tools;
  }

  /** Get the names of all connected servers. */
  getServerNames(): string[] {
    return this.servers.map((s) => s.name);
  }

  /** Close all connections. */
  async shutdown(): Promise<void> {
    for (const server of this.servers) {
      try {
        await server.client.close();
      } catch {
        // Best-effort shutdown
      }
    }
    this.servers = [];
    this.tools = [];
  }
}
