import { homedir } from "node:os";
import { resolve } from "node:path";

/**
 * Resolve the datadir path.
 * Reads `OPENEPIS_DATA_DIR` env var, falls back to `~/.openepis`.
 */
export function resolveDataDir(): string {
  const envDir = process.env.OPENEPIS_DATA_DIR;
  if (envDir) return resolve(envDir);
  return resolve(homedir(), ".openepis");
}
