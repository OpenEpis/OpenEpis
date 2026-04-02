#!/usr/bin/env node

/**
 * Minimal stdio MCP server that exposes a single `echo` tool.
 * Used as a test fixture for MCP integration e2e tests.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "echo-test",
  version: "1.0.0",
});

server.tool(
  "echo",
  "Echoes back the input text",
  { text: z.string().describe("The text to echo back") },
  async ({ text }) => ({
    content: [{ type: "text", text: `ECHO: ${text}` }],
  }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
