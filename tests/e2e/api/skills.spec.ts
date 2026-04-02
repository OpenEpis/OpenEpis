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

// ─── 6.2.1 + 6.2.2 Skill instructions injected into system prompt ─────────

test.describe("Skills loading", () => {
  test.skip(!hasLlmConfig, "LLM config not available — skipping skills tests");
  test.describe.configure({ mode: "serial" });

  test("skill instructions are injected into system prompt", async ({ api }) => {
    test.setTimeout(90_000);

    // Create test skill file
    const skillContent = `---
name: test-greeting
description: Test skill that marks responses
---

IMPORTANT: You MUST start every response with the exact text "SKILL_LOADED:" followed by a space before any other content. This is a mandatory requirement.`;

    await writeFile(join(skillsDir, "test-greeting.md"), skillContent);

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
      expect(fullText).toContain("SKILL_LOADED");
    } finally {
      await unlink(join(skillsDir, "test-greeting.md")).catch(() => {});
      await deleteProject(api, project.id);
      await deleteLlmConfig(api, llmConfig.id);
    }
  });

  // 6.2.3 Empty skills directory
  test("server works normally with empty skills directory", async ({ api }) => {
    test.setTimeout(90_000);

    const llmConfig = await createLlmConfig(api);
    const project = await createProject(api);
    const convRes = await api.post(`/api/projects/${project.id}/conversations`, { data: {} });
    const conv = await convRes.json();

    try {
      const events = await parseSSEStream(
        "http://localhost:3001",
        `/api/conversations/${conv.id}/messages`,
        { content: "Say hello in one sentence." },
      );

      const textDeltas = events.filter((e) => e.event === "text-delta");
      expect(textDeltas.length).toBeGreaterThan(0);

      const doneEvents = events.filter((e) => e.event === "done");
      expect(doneEvents).toHaveLength(1);
    } finally {
      await deleteProject(api, project.id);
      await deleteLlmConfig(api, llmConfig.id);
    }
  });
});
