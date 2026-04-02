import { readFile } from "node:fs/promises";
import { join } from "node:path";

const PROMPT_FILES = ["role.md", "bdd-format.md", "tool-usage.md", "conversation.md"] as const;

export interface LoadedPrompts {
  role: string;
  bddFormat: string;
  toolUsage: string;
  conversation: string;
}

/**
 * Load prompt templates from `<datadirPath>/prompts/`.
 * Performs `{projectName}` substitution in role.md.
 * Throws if any prompt file is missing.
 */
export async function loadPrompts(
  datadirPath: string,
  projectName: string,
): Promise<LoadedPrompts> {
  const promptsDir = join(datadirPath, "prompts");
  const contents: string[] = [];

  for (const file of PROMPT_FILES) {
    const filePath = join(promptsDir, file);
    try {
      contents.push(await readFile(filePath, "utf-8"));
    } catch {
      throw new Error(`Missing prompt file: ${file} in ${promptsDir}`);
    }
  }

  return {
    role: contents[0].replace("{projectName}", projectName),
    bddFormat: contents[1],
    toolUsage: contents[2],
    conversation: contents[3],
  };
}
