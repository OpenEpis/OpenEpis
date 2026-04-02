import { mkdir, readdir, copyFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Ensure the datadir structure exists and copy default prompts if prompts/ was just created.
 */
export async function initDataDir(datadirPath: string, defaultsPath: string): Promise<void> {
  // Ensure datadir exists
  await mkdir(datadirPath, { recursive: true });

  // Ensure skills/ exists
  await mkdir(join(datadirPath, "skills"), { recursive: true });

  // Check if prompts/ already exists
  const promptsDir = join(datadirPath, "prompts");
  let promptsExisted = true;
  try {
    await readdir(promptsDir);
  } catch {
    promptsExisted = false;
  }

  // Create prompts/ if missing
  await mkdir(promptsDir, { recursive: true });

  // Copy defaults only if prompts/ was just created
  if (!promptsExisted) {
    const defaultPromptsDir = join(defaultsPath, "prompts");
    const files = await readdir(defaultPromptsDir);
    for (const file of files) {
      await copyFile(join(defaultPromptsDir, file), join(promptsDir, file));
    }
  }
}
