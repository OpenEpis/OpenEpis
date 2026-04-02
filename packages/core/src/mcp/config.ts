import { readFile } from "node:fs/promises";
import { join } from "node:path";

export interface McpServerConfig {
  transport: "stdio" | "http";
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
}

export interface McpConfig {
  mcpServers: Record<string, McpServerConfig>;
}

/**
 * Expand `${VAR}` and `${VAR:-default}` in a string from process.env.
 */
function expandEnvVars(value: string): string {
  return value.replace(/\$\{([^}]+)\}/g, (_, expr: string) => {
    const parts = expr.split(":-");
    const varName = parts[0];
    const defaultValue = parts.length > 1 ? parts.slice(1).join(":-") : "";
    return process.env[varName] ?? defaultValue;
  });
}

/**
 * Read and parse `.mcp.json` from the datadir.
 * Returns null if the file doesn't exist.
 */
export async function parseMcpConfig(datadirPath: string): Promise<McpConfig | null> {
  const configPath = join(datadirPath, ".mcp.json");
  let raw: string;
  try {
    raw = await readFile(configPath, "utf-8");
  } catch {
    return null;
  }

  const config = JSON.parse(raw) as McpConfig;

  // Expand env vars in env values only
  for (const server of Object.values(config.mcpServers)) {
    if (server.env) {
      for (const [key, value] of Object.entries(server.env)) {
        server.env[key] = expandEnvVars(value);
      }
    }
  }

  return config;
}
