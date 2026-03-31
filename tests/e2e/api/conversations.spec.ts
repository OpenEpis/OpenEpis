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
import crypto from "node:crypto";

// ─── 2. CRUD ────────────────────────────────────────────────────────────────

test.describe("Conversation CRUD", () => {
  test("create conversation under a project", async ({ testProject, api }) => {
    const res = await api.post(`/api/projects/${testProject.id}/conversations`, {
      data: {},
    });
    expect(res.status()).toBe(201);
    const conv = await res.json();
    expect(conv.id).toBeTruthy();
    expect(conv.project_id).toBe(testProject.id);
    expect(conv.status).toBe("active");
    expect(conv.messages).toEqual([]);
    expect(conv.pending_changes).toBeNull();
    expect(conv.created_at).toBeTruthy();
    expect(conv.updated_at).toBeTruthy();

    await api.delete(`/api/conversations/${conv.id}`);
  });

  test("create conversation with non-existent project returns 404", async ({ api }) => {
    const fakeId = crypto.randomUUID();
    const res = await api.post(`/api/projects/${fakeId}/conversations`, {
      data: {},
    });
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("PROJECT_NOT_FOUND");
  });

  test("list conversations for a project", async ({ testProject, api }) => {
    const r1 = await api.post(`/api/projects/${testProject.id}/conversations`, { data: {} });
    const r2 = await api.post(`/api/projects/${testProject.id}/conversations`, { data: {} });
    const c1 = await r1.json();
    const c2 = await r2.json();

    const listRes = await api.get(`/api/projects/${testProject.id}/conversations`);
    expect(listRes.ok()).toBeTruthy();
    const { conversations } = await listRes.json();
    expect(conversations.length).toBe(2);
    for (const c of conversations) {
      expect(c.id).toBeTruthy();
      expect(c.status).toBeTruthy();
      expect(c.created_at).toBeTruthy();
      expect(c.updated_at).toBeTruthy();
      expect(typeof c.message_count).toBe("number");
    }

    await api.delete(`/api/conversations/${c1.id}`);
    await api.delete(`/api/conversations/${c2.id}`);
  });

  test("list conversations for project with no conversations", async ({ testProject, api }) => {
    const res = await api.get(`/api/projects/${testProject.id}/conversations`);
    expect(res.ok()).toBeTruthy();
    const { conversations } = await res.json();
    expect(conversations).toEqual([]);
  });

  test("get conversation detail", async ({ testConversation, api }) => {
    const { conversation } = testConversation;
    const res = await api.get(`/api/conversations/${conversation.id}`);
    expect(res.ok()).toBeTruthy();
    const detail = await res.json();
    expect(detail.id).toBe(conversation.id);
    expect(Array.isArray(detail.messages)).toBeTruthy();
    expect(detail).toHaveProperty("pending_changes");
  });

  test("get non-existent conversation returns 404", async ({ api }) => {
    const fakeId = crypto.randomUUID();
    const res = await api.get(`/api/conversations/${fakeId}`);
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("CONVERSATION_NOT_FOUND");
  });

  test("delete conversation", async ({ testProject, api }) => {
    const createRes = await api.post(`/api/projects/${testProject.id}/conversations`, {
      data: {},
    });
    const conv = await createRes.json();

    const deleteRes = await api.delete(`/api/conversations/${conv.id}`);
    expect(deleteRes.status()).toBe(204);

    const getRes = await api.get(`/api/conversations/${conv.id}`);
    expect(getRes.status()).toBe(404);
  });
});

// ─── 3. SSE Message Streaming ───────────────────────────────────────────────

test.describe("Conversation SSE messaging", () => {
  test.skip(!hasLlmConfig, "LLM config not available — skipping SSE tests");
  test.describe.configure({ mode: "serial" });

  test("send message and receive SSE stream with text-delta and done events", async ({ api }) => {
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
      for (const td of textDeltas) {
        expect(td.data).toHaveProperty("delta");
      }

      const doneEvents = events.filter((e) => e.event === "done");
      expect(doneEvents).toHaveLength(1);
      expect(doneEvents[0].data).toHaveProperty("message_id");
    } finally {
      await deleteProject(api, project.id);
      await deleteLlmConfig(api, llmConfig.id);
    }
  });

  test("BDD generation produces bdd-change event and pending_changes", async ({ api }) => {
    test.setTimeout(90_000);

    const llmConfig = await createLlmConfig(api);
    const project = await createProject(api);
    const convRes = await api.post(`/api/projects/${project.id}/conversations`, { data: {} });
    const conv = await convRes.json();

    try {
      const events = await parseSSEStream(
        "http://localhost:3001",
        `/api/conversations/${conv.id}/messages`,
        { content: "为用户收藏功能写BDD测试场景" },
      );

      const bddChanges = events.filter((e) => e.event === "bdd-change");
      expect(bddChanges.length).toBeGreaterThan(0);
      const lastChange = bddChanges[bddChanges.length - 1].data as {
        changes: { new_features: unknown[]; modified_features: unknown[] };
      };
      expect(lastChange.changes).toBeTruthy();

      const detailRes = await api.get(`/api/conversations/${conv.id}`);
      const detail = await detailRes.json();
      expect(detail.pending_changes).not.toBeNull();
    } finally {
      await deleteProject(api, project.id);
      await deleteLlmConfig(api, llmConfig.id);
    }
  });

  test("send empty message returns 400", async ({ testConversation }) => {
    const { conversation } = testConversation;
    const res = await fetch(`http://localhost:3001/api/conversations/${conversation.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  test("send message to non-existent conversation returns 404", async () => {
    const fakeId = crypto.randomUUID();
    const res = await fetch(`http://localhost:3001/api/conversations/${fakeId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "hello" }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("CONVERSATION_NOT_FOUND");
  });

  test("SSE stream handles missing LLM config gracefully", async ({ testProject, api }) => {
    test.setTimeout(30_000);

    const convRes = await api.post(`/api/projects/${testProject.id}/conversations`, { data: {} });
    const conv = await convRes.json();

    try {
      // No LLM config created — should fail with LLM_CONFIG_MISSING
      const res = await fetch(`http://localhost:3001/api/conversations/${conv.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "hello" }),
      });
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(["LLM_CONFIG_MISSING", "INTERNAL_ERROR"]).toContain(body.error.code);
    } finally {
      await api.delete(`/api/conversations/${conv.id}`);
    }
  });

  test("multi-turn conversation preserves message ordering", async ({ api }) => {
    test.setTimeout(180_000);

    const llmConfig = await createLlmConfig(api);
    const project = await createProject(api);
    const convRes = await api.post(`/api/projects/${project.id}/conversations`, { data: {} });
    const conv = await convRes.json();

    try {
      // First message
      await parseSSEStream("http://localhost:3001", `/api/conversations/${conv.id}/messages`, {
        content: "Say hello in one sentence.",
      });

      // Second message
      await parseSSEStream("http://localhost:3001", `/api/conversations/${conv.id}/messages`, {
        content: "Say goodbye in one sentence.",
      });

      const detailRes = await api.get(`/api/conversations/${conv.id}`);
      const detail = await detailRes.json();

      // Should have at least 2 user + 2 assistant messages
      const userMsgs = detail.messages.filter((m: { role: string }) => m.role === "user");
      const assistantMsgs = detail.messages.filter((m: { role: string }) => m.role === "assistant");
      expect(userMsgs.length).toBeGreaterThanOrEqual(2);
      expect(assistantMsgs.length).toBeGreaterThanOrEqual(2);

      // Verify interleaving: user messages should come before their assistant responses
      let lastUserIdx = -1;
      for (let i = 0; i < detail.messages.length; i++) {
        if (detail.messages[i].role === "user") {
          expect(i).toBeGreaterThan(lastUserIdx);
          lastUserIdx = i;
        }
      }
    } finally {
      await deleteProject(api, project.id);
      await deleteLlmConfig(api, llmConfig.id);
    }
  });

  test("messages are persisted after streaming completes", async ({ api }) => {
    test.setTimeout(90_000);

    const llmConfig = await createLlmConfig(api);
    const project = await createProject(api);
    const convRes = await api.post(`/api/projects/${project.id}/conversations`, { data: {} });
    const conv = await convRes.json();

    try {
      await parseSSEStream("http://localhost:3001", `/api/conversations/${conv.id}/messages`, {
        content: "Say hello in one sentence.",
      });

      const detailRes = await api.get(`/api/conversations/${conv.id}`);
      const detail = await detailRes.json();
      expect(detail.messages.length).toBeGreaterThanOrEqual(2);

      const userMsg = detail.messages.find((m: { role: string }) => m.role === "user");
      expect(userMsg).toBeTruthy();
      expect(userMsg.content).toContain("hello");

      const assistantMsg = detail.messages.find((m: { role: string }) => m.role === "assistant");
      expect(assistantMsg).toBeTruthy();
    } finally {
      await deleteProject(api, project.id);
      await deleteLlmConfig(api, llmConfig.id);
    }
  });
});

// ─── 4. Apply / Discard ─────────────────────────────────────────────────────

test.describe("Conversation Apply / Discard", () => {
  test.skip(!hasLlmConfig, "LLM config not available — skipping apply/discard tests");
  test.describe.configure({ mode: "serial" });

  test("apply pending changes creates features", async ({ api }) => {
    test.setTimeout(180_000);

    const llmConfig = await createLlmConfig(api);
    const project = await createProject(api);
    const convRes = await api.post(`/api/projects/${project.id}/conversations`, { data: {} });
    const conv = await convRes.json();

    try {
      await parseSSEStream("http://localhost:3001", `/api/conversations/${conv.id}/messages`, {
        content: "为购物车功能写BDD测试场景",
      });

      const beforeRes = await api.get(`/api/conversations/${conv.id}`);
      const before = await beforeRes.json();
      expect(before.pending_changes).not.toBeNull();

      const applyRes = await api.post(`/api/conversations/${conv.id}/apply`);
      const applyBody = await applyRes.json();
      expect(applyRes.ok(), `Apply failed: ${JSON.stringify(applyBody)}`).toBeTruthy();
      expect(applyBody.applied_features).toBeTruthy();
      expect(applyBody.applied_features.length).toBeGreaterThan(0);

      const afterRes = await api.get(`/api/conversations/${conv.id}`);
      const after = await afterRes.json();
      expect(after.pending_changes).toBeNull();

      const featuresRes = await api.get(`/api/projects/${project.id}/features`);
      const { features } = await featuresRes.json();
      expect(features.length).toBeGreaterThan(0);
    } finally {
      await deleteProject(api, project.id);
      await deleteLlmConfig(api, llmConfig.id);
    }
  });

  test("apply after multi-turn creates correct features", async ({ api }) => {
    test.setTimeout(180_000);

    const llmConfig = await createLlmConfig(api);
    const project = await createProject(api);
    const convRes = await api.post(`/api/projects/${project.id}/conversations`, { data: {} });
    const conv = await convRes.json();

    try {
      // First turn: generate BDD
      await parseSSEStream("http://localhost:3001", `/api/conversations/${conv.id}/messages`, {
        content: "为用户注册功能写BDD测试场景",
      });

      // Second turn: add more scenarios
      await parseSSEStream("http://localhost:3001", `/api/conversations/${conv.id}/messages`, {
        content: "再加一个场景：邮箱格式无效时注册失败",
      });

      const beforeRes = await api.get(`/api/conversations/${conv.id}`);
      const before = await beforeRes.json();
      expect(before.pending_changes).not.toBeNull();

      // Apply
      const applyRes = await api.post(`/api/conversations/${conv.id}/apply`);
      expect(applyRes.ok()).toBeTruthy();
      const applyBody = await applyRes.json();
      expect(applyBody.applied_features.length).toBeGreaterThan(0);

      // Verify features in DB
      const featuresRes = await api.get(`/api/projects/${project.id}/features`);
      const { features } = await featuresRes.json();
      expect(features.length).toBeGreaterThan(0);

      for (const feature of features) {
        expect(feature.title).toBeTruthy();
        const detailRes = await api.get(`/api/features/${feature.id}`);
        const featureDetail = await detailRes.json();
        expect(Array.isArray(featureDetail.scenarios)).toBeTruthy();
        expect(featureDetail.scenarios.length).toBeGreaterThan(0);
      }
    } finally {
      await deleteProject(api, project.id);
      await deleteLlmConfig(api, llmConfig.id);
    }
  });

  test("apply with no pending changes returns 400", async ({ testConversation, api }) => {
    const { conversation } = testConversation;
    const res = await api.post(`/api/conversations/${conversation.id}/apply`);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("NO_PENDING_CHANGES");
  });

  test("discard pending changes clears them", async ({ api }) => {
    test.setTimeout(90_000);

    const llmConfig = await createLlmConfig(api);
    const project = await createProject(api);
    const convRes = await api.post(`/api/projects/${project.id}/conversations`, { data: {} });
    const conv = await convRes.json();

    try {
      await parseSSEStream("http://localhost:3001", `/api/conversations/${conv.id}/messages`, {
        content: "为用户登录功能写BDD测试场景",
      });

      const beforeRes = await api.get(`/api/conversations/${conv.id}`);
      const before = await beforeRes.json();
      expect(before.pending_changes).not.toBeNull();

      const discardRes = await api.post(`/api/conversations/${conv.id}/discard`);
      expect(discardRes.ok()).toBeTruthy();
      const discardBody = await discardRes.json();
      expect(discardBody.ok).toBe(true);

      const afterRes = await api.get(`/api/conversations/${conv.id}`);
      const after = await afterRes.json();
      expect(after.pending_changes).toBeNull();
    } finally {
      await deleteProject(api, project.id);
      await deleteLlmConfig(api, llmConfig.id);
    }
  });
});
