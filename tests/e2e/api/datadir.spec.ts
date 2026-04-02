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

// ─── 6.1.1 Health endpoint (validates datadir bootstrap didn't break startup) ───

test("health endpoint returns ok after datadir bootstrap", async ({ api }) => {
  const res = await api.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.status).toBe("ok");
});

// ─── 6.1.2 Prompts loaded from datadir ────────────────────────────────────────

test.describe("Datadir prompt loading", () => {
  test.skip(!hasLlmConfig, "LLM config not available — skipping datadir prompt tests");

  test("agent responds using prompts loaded from datadir files", async ({ api }) => {
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
