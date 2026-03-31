import { test, expect } from "../fixtures/data-fixtures.js";

test.describe("Repository linking", () => {
  test("create and list repositories", async ({ testProject, api }) => {
    const createRes = await api.post(`/api/projects/${testProject.id}/repositories`, {
      data: {
        name: "openepis",
        git_url: "https://github.com/example/openepis.git",
      },
    });
    expect(createRes.status()).toBe(201);
    const repo = await createRes.json();
    expect(repo.name).toBe("openepis");

    const listRes = await api.get(`/api/projects/${testProject.id}/repositories`);
    expect(listRes.ok()).toBeTruthy();
    const { repositories } = await listRes.json();
    expect(repositories.some((r: { id: string }) => r.id === repo.id)).toBeTruthy();
  });

  test("delete repository", async ({ testProject, api }) => {
    const createRes = await api.post(`/api/projects/${testProject.id}/repositories`, {
      data: {
        name: "to-delete",
        git_url: "https://github.com/example/to-delete.git",
      },
    });
    const repo = await createRes.json();

    const deleteRes = await api.delete(`/api/repositories/${repo.id}`);
    expect(deleteRes.status()).toBe(204);
  });
});
