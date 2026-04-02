/**
 * 6.5.1 Regression: Verify existing conversation tests still pass after datadir migration.
 *
 * This is validated by running the full test suite — specifically:
 * - conversations.spec.ts (BDD generation, apply/discard, multi-turn)
 * - agent-behavior.spec.ts
 *
 * This file performs a quick smoke test to confirm the core agent flow
 * (create conversation → send message → get response → apply changes)
 * works end-to-end with prompts loaded from the datadir rather than templates.ts.
 */

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

test.describe("Regression: datadir migration", () => {
  test.skip(!hasLlmConfig, "LLM config not available — skipping regression tests");
  test.describe.configure({ mode: "serial" });

  test("BDD generation and apply still work after datadir migration", async ({ api }) => {
    test.setTimeout(180_000);

    const llmConfig = await createLlmConfig(api);
    const project = await createProject(api);
    const convRes = await api.post(`/api/projects/${project.id}/conversations`, { data: {} });
    const conv = await convRes.json();

    try {
      // Generate BDD
      const events = await parseSSEStream(
        "http://localhost:3001",
        `/api/conversations/${conv.id}/messages`,
        { content: "为用户登录功能写BDD测试场景" },
      );

      const bddChanges = events.filter((e) => e.event === "bdd-change");
      expect(bddChanges.length).toBeGreaterThan(0);

      // Verify pending changes exist
      const detailRes = await api.get(`/api/conversations/${conv.id}`);
      const detail = await detailRes.json();
      expect(detail.pending_changes).not.toBeNull();

      // Apply changes
      const applyRes = await api.post(`/api/conversations/${conv.id}/apply`);
      expect(applyRes.ok()).toBeTruthy();
      const applyBody = await applyRes.json();
      expect(applyBody.applied_features.length).toBeGreaterThan(0);

      // Verify features created
      const featuresRes = await api.get(`/api/projects/${project.id}/features`);
      const { features } = await featuresRes.json();
      expect(features.length).toBeGreaterThan(0);
    } finally {
      await deleteProject(api, project.id);
      await deleteLlmConfig(api, llmConfig.id);
    }
  });
});
