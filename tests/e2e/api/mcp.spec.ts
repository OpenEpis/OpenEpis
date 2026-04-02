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

// ─── 6.3.3 MCP tools are bridged ──────────────────────────────────────────────

test.describe("MCP tool bridging", () => {
  test.skip(!hasLlmConfig, "LLM config not available — skipping MCP tests");
  test.describe.configure({ mode: "serial" });

  test("agent can call echo MCP tool and incorporate result", async ({ api }) => {
    test.setTimeout(120_000);

    const llmConfig = await createLlmConfig(api);
    const project = await createProject(api);
    const convRes = await api.post(`/api/projects/${project.id}/conversations`, { data: {} });
    const conv = await convRes.json();

    try {
      const events = await parseSSEStream(
        "http://localhost:3001",
        `/api/conversations/${conv.id}/messages`,
        {
          content:
            'You have access to an echo tool (echo-test__echo). Please use it to echo the text "MCP_BRIDGE_TEST_42". Report what the tool returned.',
        },
      );

      const textDeltas = events.filter((e) => e.event === "text-delta");
      const fullText = textDeltas.map((e) => (e.data as { delta: string }).delta).join("");

      // The agent should mention the echoed text in its response
      expect(fullText).toContain("MCP_BRIDGE_TEST_42");

      const doneEvents = events.filter((e) => e.event === "done");
      expect(doneEvents).toHaveLength(1);
    } finally {
      await deleteProject(api, project.id);
      await deleteLlmConfig(api, llmConfig.id);
    }
  });

  // 6.3.4 Server starts without .mcp.json — tested implicitly by health check
  // The health endpoint test in datadir.spec.ts validates this when no .mcp.json is present
});
