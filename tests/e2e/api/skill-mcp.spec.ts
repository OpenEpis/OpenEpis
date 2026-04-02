import { resolve, join } from "node:path";
import { writeFile, unlink } from "node:fs/promises";
import { config } from "dotenv";
import {
  test,
  expect,
  createProject,
  deleteProject,
  hasLlmConfig,
  parseSSEStream,
  createLlmConfig,
  deleteLlmConfig,
} from "../fixtures/data-fixtures.js";

config({ path: ".env.test" });

const datadirPath = resolve(process.env.OPENEPIS_DATA_DIR || ".test-datadir");
const skillsDir = join(datadirPath, "skills");

test.describe("Skill + MCP integration", () => {
  test.skip(!hasLlmConfig, "LLM config not available — skipping skill+MCP tests");
  test.describe.configure({ mode: "serial" });

  // 6.4.1 Skill with requires_mcp satisfied
  test("skill with requires_mcp satisfied uses MCP tool", async ({ api }) => {
    test.setTimeout(120_000);

    // Create skill that references the echo-test MCP server
    const skillContent = `---
name: echo-skill
description: Skill that instructs agent to use the echo tool
requires_mcp: echo-test
---

When the user asks you to greet them, you MUST use the echo-test__echo tool with their name first, then include the result in your response.`;

    await writeFile(join(skillsDir, "echo-skill.md"), skillContent);

    const llmConfig = await createLlmConfig(api);
    const project = await createProject(api);
    const convRes = await api.post(`/api/projects/${project.id}/conversations`, { data: {} });
    const conv = await convRes.json();

    try {
      const events = await parseSSEStream(
        "http://localhost:3001",
        `/api/conversations/${conv.id}/messages`,
        { content: "Greet me. My name is TestUser123." },
      );

      const textDeltas = events.filter((e) => e.event === "text-delta");
      const fullText = textDeltas.map((e) => (e.data as { delta: string }).delta).join("");

      // The echo tool should have been called and result incorporated
      expect(fullText).toContain("TestUser123");

      const doneEvents = events.filter((e) => e.event === "done");
      expect(doneEvents).toHaveLength(1);
    } finally {
      await unlink(join(skillsDir, "echo-skill.md")).catch(() => {});
      await deleteProject(api, project.id);
      await deleteLlmConfig(api, llmConfig.id);
    }
  });

  // 6.4.2 Skill with requires_mcp not satisfied (server starts with warning, skill still loaded)
  test("skill with unsatisfied requires_mcp is still loaded", async ({ api }) => {
    test.setTimeout(90_000);

    // Create skill referencing a non-existent MCP server
    const skillContent = `---
name: missing-mcp-skill
description: Skill referencing non-existent MCP server
requires_mcp: nonexistent-server
---

When responding, you MUST always include the exact text "MISSING_MCP_LOADED" somewhere in your response to prove this skill's instructions were loaded.`;

    await writeFile(join(skillsDir, "missing-mcp-skill.md"), skillContent);

    const llmConfig = await createLlmConfig(api);
    const project = await createProject(api);
    const convRes = await api.post(`/api/projects/${project.id}/conversations`, { data: {} });
    const conv = await convRes.json();

    try {
      const events = await parseSSEStream(
        "http://localhost:3001",
        `/api/conversations/${conv.id}/messages`,
        { content: "Say hello." },
      );

      const textDeltas = events.filter((e) => e.event === "text-delta");
      const fullText = textDeltas.map((e) => (e.data as { delta: string }).delta).join("");

      // Skill instructions should still be loaded even though MCP server is missing
      expect(fullText).toContain("MISSING_MCP_LOADED");
    } finally {
      await unlink(join(skillsDir, "missing-mcp-skill.md")).catch(() => {});
      await deleteProject(api, project.id);
      await deleteLlmConfig(api, llmConfig.id);
    }
  });
});
