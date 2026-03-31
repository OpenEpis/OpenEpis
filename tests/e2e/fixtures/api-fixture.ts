import { test as base, type APIRequestContext } from "@playwright/test";

type ApiFixtures = {
  api: APIRequestContext;
};

export const test = base.extend<ApiFixtures>({
  api: async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({
      baseURL: "http://localhost:3001",
    });
    await use(ctx);
    await ctx.dispose();
  },
});

export { expect } from "@playwright/test";
