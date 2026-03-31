import { test, expect } from "../fixtures/data-fixtures.js";

test.describe("Async tasks", () => {
  test("init BDD and poll task status", async ({ testProject, api }) => {
    const initRes = await api.post(`/api/projects/${testProject.id}/init`, {
      data: {},
    });
    expect(initRes.status()).toBe(202);
    const { task_id, status } = await initRes.json();
    expect(task_id).toBeTruthy();
    expect(status).toBe("queued");

    const taskRes = await api.get(`/api/tasks/${task_id}`);
    expect(taskRes.ok()).toBeTruthy();
    const task = await taskRes.json();
    expect(task.id).toBe(task_id);
    expect(task.type).toBe("init_bdd");
    expect(task.status).toBeDefined();
    expect(task.progress).toBeDefined();
  });
});
