import type { AgentTool } from "@mariozechner/pi-agent-core";
import { Type, type TSchema } from "@sinclair/typebox";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Convert an MCP tool definition to a pi-agent-core AgentTool.
 * Namespaces tool name as `<server>__<tool>`.
 */
export function bridgeMcpTool(
  mcpTool: Tool,
  mcpClient: Client,
  serverName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): AgentTool<any> {
  const namespacedName = `${serverName}__${mcpTool.name}`;
  const parameters: TSchema = Type.Unsafe(mcpTool.inputSchema);

  return {
    name: namespacedName,
    label: mcpTool.name,
    description: mcpTool.description ?? "",
    parameters,
    execute: async (_toolCallId: string, args: unknown) => {
      const result = await mcpClient.callTool({
        name: mcpTool.name,
        arguments: args as Record<string, unknown>,
      });

      // Filter to text content only in MVP
      const textContent = Array.isArray(result.content)
        ? result.content
            .filter((item): item is { type: "text"; text: string } => item.type === "text")
            .map((item) => ({ type: "text" as const, text: item.text }))
        : [{ type: "text" as const, text: String(result.content) }];

      return {
        content: textContent.length > 0 ? textContent : [{ type: "text" as const, text: "" }],
        details: undefined,
      };
    },
  };
}
