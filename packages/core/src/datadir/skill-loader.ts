import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";

export interface LoadedSkill {
  name: string;
  description: string;
  requiresMcp?: string;
  instructions: string;
}

/**
 * Load skill instruction files from `<datadirPath>/skills/`.
 * Parses YAML frontmatter (name, description, requires_mcp).
 * Skips files with invalid frontmatter with a warning.
 */
export async function loadSkills(
  datadirPath: string,
  configuredMcpServers?: string[],
): Promise<LoadedSkill[]> {
  const skillsDir = join(datadirPath, "skills");
  let files: string[];
  try {
    files = await readdir(skillsDir);
  } catch {
    return [];
  }

  const mdFiles = files.filter((f) => f.endsWith(".md"));
  const skills: LoadedSkill[] = [];

  for (const file of mdFiles) {
    const filePath = join(skillsDir, file);
    try {
      const raw = await readFile(filePath, "utf-8");
      const { data, content } = matter(raw);

      if (!data.name || !data.description) {
        console.warn(
          `[skill-loader] Skipping ${file}: missing required frontmatter (name, description)`,
        );
        continue;
      }

      const skill: LoadedSkill = {
        name: data.name as string,
        description: data.description as string,
        instructions: content.trim(),
      };

      if (data.requires_mcp) {
        skill.requiresMcp = data.requires_mcp as string;
        if (configuredMcpServers && !configuredMcpServers.includes(skill.requiresMcp)) {
          console.warn(
            `[skill-loader] Skill '${skill.name}' requires MCP server '${skill.requiresMcp}' which is not configured`,
          );
        }
      }

      skills.push(skill);
    } catch (err) {
      console.warn(
        `[skill-loader] Skipping ${file}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return skills;
}
