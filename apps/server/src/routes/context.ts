import type { FastifyInstance } from "fastify";
import type { PostContextRequest, ContextResponse } from "@openepis/types";
import type { Container } from "../container.js";
import { TOKENS } from "../container.js";
import { AppError } from "../errors.js";

export async function contextRoutes(
  app: FastifyInstance,
  opts: { container: Container },
): Promise<void> {
  const storage = opts.container.resolve(TOKENS.StorageService);

  app.post<{ Params: { id: string }; Body: PostContextRequest; Reply: ContextResponse }>(
    "/api/projects/:id/context",
    async (request, reply) => {
      const project = await storage.projects.findById(request.params.id);
      if (!project) throw new AppError(404, "NOT_FOUND", "Project not found");
      return reply.send({ related_features: [] });
    },
  );
}
