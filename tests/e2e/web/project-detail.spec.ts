import { test, expect } from "../fixtures/data-fixtures.js";

test.describe("Project detail page", () => {
  test("displays project info", async ({ page, testProject }) => {
    await page.goto(`/projects/${testProject.id}`);
    await expect(page.getByRole("heading", { name: testProject.name })).toBeVisible();
    // Feature count and repo count cards are present
    await expect(page.getByTestId("project-detail-view-features")).toBeVisible();
  });

  test("navigate to features", async ({ page, testProject }) => {
    await page.goto(`/projects/${testProject.id}`);
    await page.getByTestId("project-detail-view-features").click();
    await expect(page).toHaveURL(new RegExp(`/projects/${testProject.id}/features`));
  });
});
