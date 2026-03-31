import { test, expect } from "../fixtures/api-fixture.js";
import { randomUUID } from "crypto";

test.describe("Error response format", () => {
  test("validation error returns 400 with standard format", async ({ api }) => {
    const res = await api.post("/api/projects", {
      data: {},
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(typeof body.error.message).toBe("string");
  });

  test("not found error returns 404 with standard format", async ({ api }) => {
    const res = await api.get(`/api/projects/${randomUUID()}`);
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe("NOT_FOUND");
    expect(typeof body.error.message).toBe("string");
  });
});
