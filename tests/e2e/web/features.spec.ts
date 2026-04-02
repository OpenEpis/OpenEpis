import { test, expect } from "../fixtures/data-fixtures.js";

test.describe("Feature browsing", () => {
  test("list features", async ({ page, testFeature }) => {
    const { project, feature } = testFeature;
    await page.goto(`/projects/${project.id}/features`);
    const cards = page.getByTestId("feature-list-card");
    await expect(cards.filter({ hasText: feature.title }).first()).toBeVisible();
  });

  test("view feature detail with BDD scenarios and steps", async ({ page, testFeature }) => {
    const { project, feature } = testFeature;
    await page.goto(`/projects/${project.id}/features`);

    // Click on the feature card to navigate to detail
    const cards = page.getByTestId("feature-list-card");
    await cards.filter({ hasText: feature.title }).first().click();
    await expect(page).toHaveURL(new RegExp(`/features/${feature.id}`));

    // Feature detail should show title as main heading
    await expect(page.getByRole("heading", { level: 1, name: feature.title })).toBeVisible();

    // Should show scenarios heading
    await expect(page.getByRole("heading", { name: /Scenarios/ })).toBeVisible();

    // Should show BDD step keywords
    const main = page.getByRole("main");
    await expect(main.getByText("Given").first()).toBeVisible();
    await expect(main.getByText("When").first()).toBeVisible();
    await expect(main.getByText("Then").first()).toBeVisible();
  });
});
