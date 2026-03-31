import {
  test,
  expect,
  hasLlmConfig,
  createLlmConfig,
  deleteLlmConfig,
} from "../fixtures/data-fixtures.js";

// ─── 5.1 Conversation List Page ─────────────────────────────────────────────

test.describe("Conversation list page", () => {
  test("show empty state", async ({ page, testProject }) => {
    await page.goto(`/projects/${testProject.id}/conversations`);
    await expect(page.getByRole("heading", { name: "Conversations" })).toBeVisible();
    await expect(page.getByText("No conversations yet")).toBeVisible();
  });

  test("create new conversation and navigate to detail page", async ({ page, testProject }) => {
    await page.goto(`/projects/${testProject.id}/conversations`);
    await page.getByRole("button", { name: /New/i }).click();
    await expect(page).toHaveURL(new RegExp(`/projects/${testProject.id}/conversations/[\\w-]+`));
  });

  test("list page shows existing conversations", async ({ page, api, testProject }) => {
    // Create conversations via API
    const r1 = await api.post(`/api/projects/${testProject.id}/conversations`, { data: {} });
    const c1 = await r1.json();
    const r2 = await api.post(`/api/projects/${testProject.id}/conversations`, { data: {} });
    const c2 = await r2.json();

    await page.goto(`/projects/${testProject.id}/conversations`);

    // Should show conversation entries (with "Conversation" text and message count)
    const cards = page.locator("[class*=cursor-pointer]").filter({ hasText: "Conversation" });
    await expect(cards).toHaveCount(2);

    // cleanup
    await api.delete(`/api/conversations/${c1.id}`);
    await api.delete(`/api/conversations/${c2.id}`);
  });

  test("delete conversation from list page", async ({ page, api, testProject }) => {
    await api.post(`/api/projects/${testProject.id}/conversations`, { data: {} });

    await page.goto(`/projects/${testProject.id}/conversations`);

    // Should show 1 conversation
    const cards = page.locator("[class*=cursor-pointer]").filter({ hasText: "Conversation" });
    await expect(cards).toHaveCount(1);

    // Click delete button (trash icon)
    await cards.first().getByRole("button").click();

    // Should show empty state
    await expect(page.getByText("No conversations yet")).toBeVisible();
  });
});

// ─── 5.2 Conversation Chat Page ─────────────────────────────────────────────

test.describe("Conversation chat page", () => {
  test.skip(!hasLlmConfig, "LLM config not available — skipping chat tests");

  let llmConfigId: string;

  test.beforeAll(async ({ api }) => {
    const config = await createLlmConfig(api);
    llmConfigId = config.id;
  });

  test.afterAll(async ({ api }) => {
    if (llmConfigId) await deleteLlmConfig(api, llmConfigId);
  });

  test("chat page shows input area", async ({ page, testConversation }) => {
    const { project, conversation } = testConversation;
    await page.goto(`/projects/${project.id}/conversations/${conversation.id}`);

    await expect(page.locator("textarea")).toBeVisible();
    await expect(page.getByRole("button").filter({ has: page.locator("svg") })).toBeVisible();
  });

  test("send message and see user bubble and streaming assistant reply", async ({
    page,
    testConversation,
  }) => {
    test.setTimeout(90_000);

    const { project, conversation } = testConversation;
    await page.goto(`/projects/${project.id}/conversations/${conversation.id}`);

    const textarea = page.locator("textarea");
    await textarea.fill("Say hi in one short sentence.");
    await textarea.press("Enter");

    // User message should appear
    await expect(page.getByText("Say hi in one short sentence.")).toBeVisible();

    // Wait for thinking indicator or streaming text
    await expect(page.getByText("Thinking...").or(page.locator(".bg-muted").last())).toBeVisible({
      timeout: 15_000,
    });

    // Wait for assistant reply to finish (no more thinking indicator)
    await expect(page.getByText("Thinking...")).toBeHidden({ timeout: 90_000 });

    // Should have at least two message bubbles (user + assistant)
    const messageBubbles = page.locator(".rounded-lg.px-4.py-2");
    await expect(messageBubbles).toHaveCount(2, { timeout: 5_000 });
  });
});

// ─── 5.3 BDD Preview Panel ─────────────────────────────────────────────────

test.describe("BDD preview panel", () => {
  test.skip(!hasLlmConfig, "LLM config not available — skipping BDD preview tests");

  let llmConfigId: string;

  test.beforeAll(async ({ api }) => {
    const config = await createLlmConfig(api);
    llmConfigId = config.id;
  });

  test.afterAll(async ({ api }) => {
    if (llmConfigId) await deleteLlmConfig(api, llmConfigId);
  });

  test("generated BDD shows in preview panel with feature card and steps", async ({
    page,
    testConversation,
  }) => {
    test.setTimeout(90_000);

    const { project, conversation } = testConversation;
    await page.goto(`/projects/${project.id}/conversations/${conversation.id}`);

    // Initially shows "No pending BDD changes"
    await expect(page.getByText("No pending BDD changes")).toBeVisible();

    const textarea = page.locator("textarea");
    await textarea.fill("为用户登录功能写BDD测试场景");
    await textarea.press("Enter");

    // Wait for BDD generation — "New" badge should appear in the preview panel
    await expect(page.getByText("New").first()).toBeVisible({ timeout: 90_000 });

    // Should show Given/When/Then steps
    const previewPanel = page.locator(".border-l");
    await expect(previewPanel.getByText("Given").first()).toBeVisible();
    await expect(previewPanel.getByText("When").first()).toBeVisible();
    await expect(previewPanel.getByText("Then").first()).toBeVisible();
  });
});

// ─── 5.4 Apply / Discard Buttons ────────────────────────────────────────────

test.describe("Apply / Discard buttons", () => {
  test.skip(!hasLlmConfig, "LLM config not available — skipping apply/discard UI tests");

  let llmConfigId: string;

  test.beforeAll(async ({ api }) => {
    const config = await createLlmConfig(api);
    llmConfigId = config.id;
  });

  test.afterAll(async ({ api }) => {
    if (llmConfigId) await deleteLlmConfig(api, llmConfigId);
  });

  test("click Apply clears pending changes", async ({ page, testConversation }) => {
    test.setTimeout(120_000);

    const { project, conversation } = testConversation;
    await page.goto(`/projects/${project.id}/conversations/${conversation.id}`);

    // Generate BDD
    const textarea = page.locator("textarea");
    await textarea.fill("为购物车功能写BDD测试场景");
    await textarea.press("Enter");

    // Wait for BDD to appear
    await expect(page.getByText("New").first()).toBeVisible({ timeout: 90_000 });

    // Click Apply All
    await page.getByRole("button", { name: /Apply All/i }).click();

    // Pending changes should be cleared
    await expect(page.getByText("No pending BDD changes")).toBeVisible({ timeout: 10_000 });
  });

  test("click Discard shows confirmation and clears pending changes", async ({
    page,
    testConversation,
  }) => {
    test.setTimeout(120_000);

    const { project, conversation } = testConversation;
    await page.goto(`/projects/${project.id}/conversations/${conversation.id}`);

    // Generate BDD
    const textarea = page.locator("textarea");
    await textarea.fill("为注册功能写BDD测试场景");
    await textarea.press("Enter");

    // Wait for BDD to appear
    await expect(page.getByText("New").first()).toBeVisible({ timeout: 90_000 });

    // Click Discard
    await page.getByRole("button", { name: /Discard/i }).click();

    // Confirmation dialog should appear
    await expect(page.getByText("Discard Changes?")).toBeVisible();

    // Confirm discard
    await page
      .getByRole("button", { name: /Discard/i })
      .last()
      .click();

    // Pending changes should be cleared
    await expect(page.getByText("No pending BDD changes")).toBeVisible({ timeout: 10_000 });
  });
});
