import { test, expect } from "../fixtures/data-fixtures.js";

test.describe("Navigation", () => {
  test("breadcrumb navigation", async ({ page, testFeature }) => {
    const { project, feature } = testFeature;

    // Navigate to feature detail page
    await page.goto(`/projects/${project.id}/features/${feature.id}`);
    await expect(page.getByRole("heading", { name: feature.title })).toBeVisible();

    // Breadcrumb should contain "Projects" link
    const projectsBreadcrumb = page.getByRole("link", { name: "Projects" }).first();
    await expect(projectsBreadcrumb).toBeVisible();

    // Click "Projects" breadcrumb to navigate back
    await projectsBreadcrumb.click();
    await expect(page).toHaveURL(/\/projects$/);
  });

  test("404 page for non-existent route", async ({ page }) => {
    await page.goto("/this-does-not-exist");
    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByText("Page not found")).toBeVisible();
  });
});
