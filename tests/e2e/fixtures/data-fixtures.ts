import { test as apiTest, expect } from "./api-fixture.js";
import type { APIRequestContext } from "@playwright/test";

type DataFixtures = {
  testProject: { id: string; name: string; description: string };
  testFeature: {
    project: { id: string; name: string };
    feature: { id: string; title: string };
  };
};

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
});

export { expect } from "@playwright/test";
export { createProject, deleteProject };
