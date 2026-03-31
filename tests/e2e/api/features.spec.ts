import { test, expect, createProject, deleteProject } from "../fixtures/data-fixtures.js";

test.describe("Feature CRUD", () => {
  test("create feature with scenarios and retrieve it", async ({ testProject, api }) => {
    const res = await api.post(`/api/projects/${testProject.id}/features`, {
      data: {
        title: "Login Feature",
        description: "User login flow",
        tags: ["auth"],
        scenarios: [
          {
            title: "Successful login",
            tags: [],
            steps: [
              { type: "given", text: "a registered user" },
              { type: "when", text: "user submits valid credentials" },
              { type: "then", text: "user is authenticated" },
            ],
          },
        ],
      },
    });
    expect(res.status()).toBe(201);
    const feature = await res.json();
    expect(feature.title).toBe("Login Feature");

    const detailRes = await api.get(`/api/features/${feature.id}`);
    expect(detailRes.ok()).toBeTruthy();
    const detail = await detailRes.json();
    expect(detail.scenarios).toHaveLength(1);
    expect(detail.scenarios[0].steps).toHaveLength(3);
  });

  test("list features with status filter", async ({ api }) => {
    const project = await createProject(api);

    await api.post(`/api/projects/${project.id}/features`, {
      data: { title: "Draft Feature", description: "draft", tags: ["auth"] },
    });

    const res = await api.get(`/api/projects/${project.id}/features?status=draft`);
    expect(res.ok()).toBeTruthy();
    const { features } = await res.json();
    expect(features.length).toBeGreaterThanOrEqual(1);
    expect(features.every((f: { status: string }) => f.status === "draft")).toBeTruthy();

    await deleteProject(api, project.id);
  });

  test("list features with tag filter", async ({ api }) => {
    const project = await createProject(api);

    await api.post(`/api/projects/${project.id}/features`, {
      data: { title: "Tagged Feature", description: "tagged", tags: ["auth"] },
    });

    const res = await api.get(`/api/projects/${project.id}/features?tag=auth`);
    expect(res.ok()).toBeTruthy();
    const { features } = await res.json();
    expect(features.length).toBeGreaterThanOrEqual(1);
    expect(features.every((f: { tags: string[] }) => f.tags.includes("auth"))).toBeTruthy();

    await deleteProject(api, project.id);
  });

  test("list features with search filter", async ({ api }) => {
    const project = await createProject(api);

    await api.post(`/api/projects/${project.id}/features`, {
      data: { title: "Login Flow", description: "handles login", tags: [] },
    });

    const res = await api.get(`/api/projects/${project.id}/features?search=login`);
    expect(res.ok()).toBeTruthy();
    const { features } = await res.json();
    expect(features.length).toBeGreaterThanOrEqual(1);

    await deleteProject(api, project.id);
  });

  test("update feature creates new version", async ({ testFeature, api }) => {
    const featureId = testFeature.feature.id;

    const updateRes = await api.put(`/api/features/${featureId}`, {
      data: {
        title: "Updated Title",
        scenarios: [
          {
            title: "Updated scenario",
            tags: [],
            steps: [
              { type: "given", text: "updated precondition" },
              { type: "then", text: "updated outcome" },
            ],
          },
        ],
      },
    });
    expect(updateRes.ok()).toBeTruthy();
    const updated = await updateRes.json();
    expect(updated.version).toBe(2);

    const revisionsRes = await api.get(`/api/features/${featureId}/revisions`);
    expect(revisionsRes.ok()).toBeTruthy();
    const { revisions } = await revisionsRes.json();
    expect(revisions.length).toBe(2);
  });

  test("feature revision history", async ({ testFeature, api }) => {
    const featureId = testFeature.feature.id;

    // Update twice to get 3 versions total
    await api.put(`/api/features/${featureId}`, {
      data: { title: "Version 2" },
    });
    await api.put(`/api/features/${featureId}`, {
      data: { title: "Version 3" },
    });

    const revisionsRes = await api.get(`/api/features/${featureId}/revisions`);
    const { revisions } = await revisionsRes.json();
    expect(revisions).toHaveLength(3);

    // Get version 1 snapshot
    const v1Res = await api.get(`/api/features/${featureId}/revisions/1`);
    expect(v1Res.ok()).toBeTruthy();
    const v1 = await v1Res.json();
    expect(v1.version).toBe(1);
    // Original title from the fixture
    expect(v1.title).toContain("Test Feature");
  });
});
