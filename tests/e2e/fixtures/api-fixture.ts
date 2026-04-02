import { test as base, type APIRequestContext } from "@playwright/test";

const port = process.env.PORT ?? "3001";
export const BASE_URL = `http://localhost:${port}`;

type ApiFixtures = {
  api: APIRequestContext;
};

export const test = base.extend<ApiFixtures>({
  api: async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({
      baseURL: BASE_URL,
    });
    await use(ctx);
    await ctx.dispose();
  },
});

export { expect } from "@playwright/test";
