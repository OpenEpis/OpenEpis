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

test.describe("Agent behavior", () => {
  test.skip(!hasLlmConfig, "LLM config not available — skipping agent behavior tests");
  test.describe.configure({ mode: "serial" });

  // ─── 6.1 update_bdd generates correct structure ───────────────────────────

  test("bdd-change event contains valid new_features structure", async ({ api }) => {
    test.setTimeout(90_000);

    const llmConfig = await createLlmConfig(api);
    const project = await createProject(api);
    const convRes = await api.post(`/api/projects/${project.id}/conversations`, { data: {} });
    const conv = await convRes.json();

    try {
      const events = await parseSSEStream(
        "http://localhost:3001",
        `/api/conversations/${conv.id}/messages`,
        { content: "为用户收藏功能写BDD" },
      );

      const bddChanges = events.filter((e) => e.event === "bdd-change");
      expect(bddChanges.length).toBeGreaterThan(0);

      const lastChange = bddChanges[bddChanges.length - 1].data as {
        changes: {
          new_features: Array<{
            title: string;
            description: string;
            temp_id: string;
            scenarios: Array<{
              title: string;
              steps: Array<{ type: string; text: string }>;
            }>;
          }>;
        };
      };

      expect(lastChange.changes.new_features.length).toBeGreaterThan(0);

      for (const feature of lastChange.changes.new_features) {
        expect(feature.title).toBeTruthy();
        expect(typeof feature.description).toBe("string");
        expect(feature.temp_id).toBeTruthy();
        expect(feature.scenarios.length).toBeGreaterThan(0);

        for (const scenario of feature.scenarios) {
          expect(scenario.title).toBeTruthy();
          expect(scenario.steps.length).toBeGreaterThan(0);

          for (const step of scenario.steps) {
            expect(["given", "when", "then", "and"]).toContain(step.type);
            expect(step.text).toBeTruthy();
          }
        }
      }
    } finally {
      await deleteProject(api, project.id);
      await deleteLlmConfig(api, llmConfig.id);
    }
  });

  // ─── 6.2 tool_calls persisted in messages ─────────────────────────────────

  test("conversation messages contain tool_calls metadata after agent run", async ({ api }) => {
    test.setTimeout(90_000);

    const llmConfig = await createLlmConfig(api);
    const project = await createProject(api);
    const convRes = await api.post(`/api/projects/${project.id}/conversations`, { data: {} });
    const conv = await convRes.json();

    try {
      const events = await parseSSEStream(
        "http://localhost:3001",
        `/api/conversations/${conv.id}/messages`,
        { content: "为用户注册功能写BDD测试场景" },
      );

      expect(events.some((e) => e.event === "done")).toBeTruthy();

      const detailRes = await api.get(`/api/conversations/${conv.id}`);
      const detail = await detailRes.json();

      const assistantMessages = detail.messages.filter(
        (m: { role: string }) => m.role === "assistant",
      );
      expect(assistantMessages.length).toBeGreaterThan(0);

      const hasUpdateBdd = detail.messages.some(
        (m: { role: string; tool_calls?: Array<{ name: string }> }) =>
          m.tool_calls?.some((tc) => tc.name === "update_bdd"),
      );
      expect(hasUpdateBdd).toBeTruthy();
    } finally {
      await deleteProject(api, project.id);
      await deleteLlmConfig(api, llmConfig.id);
    }
  });

  // ─── 6.3 context query with existing features ─────────────────────────────

  test("agent uses search_features or get_feature_detail when existing features present", async ({
    api,
  }) => {
    test.setTimeout(90_000);

    const llmConfig = await createLlmConfig(api);
    const project = await createProject(api);

    await api.post(`/api/projects/${project.id}/features`, {
      data: {
        title: "用户登录功能",
        description: "用户可以使用邮箱和密码登录系统",
        tags: ["auth"],
        scenarios: [
          {
            title: "用户使用正确的邮箱和密码登录",
            tags: [],
            steps: [
              { type: "given", text: "用户已经注册了邮箱 test@example.com" },
              { type: "when", text: "用户输入邮箱 test@example.com 和正确密码" },
              { type: "then", text: "用户成功登录并跳转到首页" },
            ],
          },
        ],
      },
    });

    const convRes = await api.post(`/api/projects/${project.id}/conversations`, { data: {} });
    const conv = await convRes.json();

    try {
      await parseSSEStream("http://localhost:3001", `/api/conversations/${conv.id}/messages`, {
        content: "在已有的用户登录功能基础上，增加记住密码的场景",
      });

      const detailRes = await api.get(`/api/conversations/${conv.id}`);
      const detail = await detailRes.json();

      const hasContextQuery = detail.messages.some(
        (m: { role: string; tool_calls?: Array<{ name: string }> }) =>
          m.tool_calls?.some(
            (tc) => tc.name === "search_features" || tc.name === "get_feature_detail",
          ),
      );
      expect(hasContextQuery).toBeTruthy();
    } finally {
      await deleteProject(api, project.id);
      await deleteLlmConfig(api, llmConfig.id);
    }
  });

  // ─── 6.4 multi-turn conversation ──────────────────────────────────────────

  test("multi-turn BDD generation merges pending_changes", async ({ api }) => {
    test.setTimeout(180_000);

    const llmConfig = await createLlmConfig(api);
    const project = await createProject(api);
    const convRes = await api.post(`/api/projects/${project.id}/conversations`, { data: {} });
    const conv = await convRes.json();

    try {
      await parseSSEStream("http://localhost:3001", `/api/conversations/${conv.id}/messages`, {
        content: "为购物车功能写BDD",
      });

      const firstRes = await api.get(`/api/conversations/${conv.id}`);
      const first = await firstRes.json();
      expect(first.pending_changes).not.toBeNull();

      await parseSSEStream("http://localhost:3001", `/api/conversations/${conv.id}/messages`, {
        content: "再加一个场景：用户可以修改商品数量",
      });

      const secondRes = await api.get(`/api/conversations/${conv.id}`);
      const second = await secondRes.json();
      expect(second.pending_changes).not.toBeNull();

      const userMessages = second.messages.filter((m: { role: string }) => m.role === "user");
      const assistantMessages = second.messages.filter(
        (m: { role: string }) => m.role === "assistant",
      );
      expect(userMessages.length).toBe(2);
      expect(assistantMessages.length).toBeGreaterThanOrEqual(2);
    } finally {
      await deleteProject(api, project.id);
      await deleteLlmConfig(api, llmConfig.id);
    }
  });
});
