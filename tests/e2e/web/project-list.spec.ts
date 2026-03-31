import { test, expect, createProject, deleteProject } from "../fixtures/data-fixtures.js";

test.describe("Project list page", () => {
  test("displays projects", async ({ page, api }) => {
    const project = await createProject(api, { name: `E2E Project ${Date.now()}` });

    await page.goto("/projects");
    const main = page.getByRole("main");
    await expect(main.getByText(project.name).first()).toBeVisible();

    await deleteProject(api, project.id);
  });

  test("navigate to create project", async ({ page }) => {
    await page.goto("/projects");
    await page.getByRole("link", { name: /Create Project/i }).click();
    await expect(page).toHaveURL(/\/projects\/new/);
  });
});
