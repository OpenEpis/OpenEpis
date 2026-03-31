import { test, expect } from "../fixtures/data-fixtures.js";

test.describe("Project detail page", () => {
  test("displays project info", async ({ page, testProject }) => {
    await page.goto(`/projects/${testProject.id}`);
    await expect(page.getByRole("heading", { name: testProject.name })).toBeVisible();
    // Feature count and repo count cards are present
    await expect(page.getByRole("link", { name: /View Features/i })).toBeVisible();
  });

  test("navigate to features", async ({ page, testProject }) => {
    await page.goto(`/projects/${testProject.id}`);
    await page.getByRole("link", { name: /View Features/i }).click();
    await expect(page).toHaveURL(new RegExp(`/projects/${testProject.id}/features`));
  });
});
