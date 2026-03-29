import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { existsSync } from "node:fs";

export interface OpenEpisConfig {
  apiUrl: string;
  projectId: string;
}

const CONFIG_FILE = ".openepis.json";

function findConfigFile(startDir: string): string | null {
  let dir = resolve(startDir);
  while (true) {
    const candidate = resolve(dir, CONFIG_FILE);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function loadConfig(): OpenEpisConfig {
  const configPath = findConfigFile(process.cwd());
  if (!configPath) {
    console.error(`Error: No ${CONFIG_FILE} found in current directory or any parent directory.`);
    console.error(`Create a ${CONFIG_FILE} with { "apiUrl": "...", "projectId": "..." }`);
    process.exit(1);
  }
  const raw = readFileSync(configPath, "utf-8");
  const config = JSON.parse(raw) as OpenEpisConfig;
  if (!config.apiUrl || !config.projectId) {
    console.error(`Error: ${CONFIG_FILE} must contain "apiUrl" and "projectId".`);
    process.exit(1);
  }
  return config;
}
