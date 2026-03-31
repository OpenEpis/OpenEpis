import { test, expect } from "../fixtures/data-fixtures.js";
import { randomUUID } from "crypto";

test.describe("Project CRUD", () => {
  test("create and list projects", async ({ api }) => {
    const name = `Project ${Date.now()}`;
    const createRes = await api.post("/api/projects", {
      data: { name, description: "test desc" },
    });
    expect(createRes.status()).toBe(201);
    const project = await createRes.json();
    expect(project).toMatchObject({
      name,
      description: "test desc",
    });
    expect(project.id).toBeTruthy();
    expect(project.created_at).toBeTruthy();

    const listRes = await api.get("/api/projects");
    expect(listRes.ok()).toBeTruthy();
    const { projects } = await listRes.json();
    expect(projects.some((p: { id: string }) => p.id === project.id)).toBeTruthy();

    // cleanup
    await api.delete(`/api/projects/${project.id}`);
  });

  test("get project detail", async ({ testProject, api }) => {
    const res = await api.get(`/api/projects/${testProject.id}`);
    expect(res.ok()).toBeTruthy();
    const detail = await res.json();
    expect(detail).toMatchObject({
      id: testProject.id,
      name: testProject.name,
    });
    expect(detail.repo_count).toBeDefined();
    expect(detail.feature_count).toBeDefined();
  });

  test("update project", async ({ testProject, api }) => {
    const res = await api.put(`/api/projects/${testProject.id}`, {
      data: { name: "Updated Name" },
    });
    expect(res.ok()).toBeTruthy();
    const updated = await res.json();
    expect(updated.name).toBe("Updated Name");
  });

  test("delete project", async ({ api }) => {
    const createRes = await api.post("/api/projects", {
      data: { name: `ToDelete ${Date.now()}` },
    });
    const project = await createRes.json();

    const deleteRes = await api.delete(`/api/projects/${project.id}`);
    expect(deleteRes.status()).toBe(204);

    const getRes = await api.get(`/api/projects/${project.id}`);
    expect(getRes.status()).toBe(404);
  });

  test("get non-existent project returns 404", async ({ api }) => {
    const res = await api.get(`/api/projects/${randomUUID()}`);
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });
});
