import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import type { IStorageService } from "@openepis/storage";
import type { RequestUser } from "../types.js";

const DEFAULT_USER: RequestUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "system@openepis.dev",
  name: "System",
};

export const currentUserPlugin = fp(
  async (fastify: FastifyInstance, opts: { storage: IStorageService }) => {
    // MVP-0: seed default user into database
    const existing = await opts.storage.users.findById(DEFAULT_USER.id);
    if (!existing) {
      // Cast to include `id` — the underlying Drizzle insert accepts it.
      // This seed logic is removed in MVP-1 when real auth is introduced.
      await opts.storage.users.create({
        id: DEFAULT_USER.id,
        email: DEFAULT_USER.email,
        name: DEFAULT_USER.name,
        avatar_url: null,
      } as Parameters<IStorageService["users"]["create"]>[0]);
    }

    fastify.decorateRequest("user", null as unknown as RequestUser);

    fastify.addHook("onRequest", async (request) => {
      request.user = DEFAULT_USER;
    });
  },
  { name: "current-user" },
);
