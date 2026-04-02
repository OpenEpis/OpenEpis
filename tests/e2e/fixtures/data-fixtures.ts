import { test as apiTest, expect, BASE_URL } from "./api-fixture.js";
import type { APIRequestContext } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.test" });

// LLM config env vars
const LLM_CONFIG_PROVIDER = process.env.LLM_CONFIG_PROVIDER;
const LLM_CONFIG_MODEL = process.env.LLM_CONFIG_MODEL;
const LLM_CONFIG_API_KEY = process.env.LLM_CONFIG_API_KEY;
const LLM_CONFIG_BASE_URL = process.env.LLM_CONFIG_BASE_URL;

export const hasLlmConfig = !!(LLM_CONFIG_PROVIDER && LLM_CONFIG_MODEL && LLM_CONFIG_API_KEY);

// --- Helpers ---

async function createProject(
  api: APIRequestContext,
  overrides?: { name?: string; description?: string },
) {
  const name = overrides?.name ?? `Test Project ${Date.now()}`;
  const description = overrides?.description ?? "A test project";
  const res = await api.post("/api/projects", {
    data: { name, description },
  });
  expect(res.status()).toBe(201);
  return res.json();
}

async function deleteProject(api: APIRequestContext, id: string) {
  await api.delete(`/api/projects/${id}`);
}

async function createLlmConfig(api: APIRequestContext) {
  const res = await api.post("/api/llm-configs", {
    data: {
      scope: "platform",
      provider: LLM_CONFIG_PROVIDER,
      model: LLM_CONFIG_MODEL,
      api_key: LLM_CONFIG_API_KEY,
      base_url: LLM_CONFIG_BASE_URL || undefined,
      is_active: true,
    },
  });
  expect(res.status()).toBe(201);
  return res.json();
}

async function deleteLlmConfig(api: APIRequestContext, id: string) {
  await api.delete(`/api/llm-configs/${id}`);
}

// --- SSE Stream Parser ---

export interface SSEEvent {
  event: string;
  data: unknown;
}

export async function parseSSEStream(
  baseUrl: string,
  path: string,
  body: Record<string, unknown>,
): Promise<SSEEvent[]> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok || !response.body) {
    throw new Error(`SSE request failed: ${response.status} ${response.statusText}`);
  }

  const events: SSEEvent[] = [];
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    let currentEvent = "";
    let currentData = "";

    for (const line of lines) {
      if (line.startsWith("event:")) {
        currentEvent = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        currentData = line.slice(5).trim();
      } else if (line === "" && currentEvent) {
        try {
          events.push({ event: currentEvent, data: JSON.parse(currentData) });
        } catch {
          events.push({ event: currentEvent, data: currentData });
        }
        currentEvent = "";
        currentData = "";
      }
    }
  }

  return events;
}

// --- Fixtures ---

type DataFixtures = {
  testProject: { id: string; name: string; description: string };
  testFeature: {
    project: { id: string; name: string };
    feature: { id: string; title: string };
  };
  testLlmConfig: { id: string };
  testConversation: {
    project: { id: string; name: string };
    conversation: { id: string };
  };
};

export const test = apiTest.extend<DataFixtures>({
  testProject: async ({ api }, use) => {
    const project = await createProject(api);
    await use(project);
    await deleteProject(api, project.id);
  },

  testFeature: async ({ api }, use) => {
    const project = await createProject(api);
    const featureRes = await api.post(`/api/projects/${project.id}/features`, {
      data: {
        title: `Test Feature ${Date.now()}`,
        description: "A test feature with BDD scenarios",
        tags: ["test"],
        scenarios: [
          {
            title: "User can perform action",
            tags: [],
            steps: [
              { type: "given", text: "a user is logged in" },
              { type: "when", text: "the user clicks the button" },
              { type: "then", text: "the action is performed" },
            ],
          },
        ],
      },
    });
    expect(featureRes.status()).toBe(201);
    const feature = await featureRes.json();
    await use({ project, feature });
    await deleteProject(api, project.id);
  },

  testLlmConfig: async ({ api }, use) => {
    const llmConfig = await createLlmConfig(api);
    await use(llmConfig);
    await deleteLlmConfig(api, llmConfig.id);
  },

  testConversation: async ({ api }, use) => {
    const project = await createProject(api);
    const convRes = await api.post(`/api/projects/${project.id}/conversations`, {
      data: {},
    });
    expect(convRes.status()).toBe(201);
    const conversation = await convRes.json();
    await use({ project, conversation });
    await deleteProject(api, project.id);
  },
});

export { expect } from "@playwright/test";
export { BASE_URL };
export { createProject, deleteProject, createLlmConfig, deleteLlmConfig };
