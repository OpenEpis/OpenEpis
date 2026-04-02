import { test, expect } from "../fixtures/data-fixtures.js";

test.describe("Create project page", () => {
  test("create project with valid data", async ({ page, api }) => {
    const name = `Web E2E ${Date.now()}`;

    await page.goto("/projects/new");
    await page.getByLabel(/Name/i).fill(name);
    await page.getByLabel(/Description/i).fill("Created by e2e test");
    await page.getByRole("button", { name: /^Create$/i }).click();

    // Should navigate to the new project detail page
    await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+$/);
    await expect(page.getByRole("heading", { name })).toBeVisible();

    // Cleanup: extract project id from URL and delete
    const url = page.url();
    const projectId = url.split("/projects/")[1];
    if (projectId) {
      await api.delete(`/api/projects/${projectId}`);
    }
  });

  test("validation on empty name", async ({ page }) => {
    await page.goto("/projects/new");
    await page.getByRole("button", { name: /^Create$/i }).click();

    await expect(page.getByTestId("create-project-name-error")).toBeVisible();
  });
});
