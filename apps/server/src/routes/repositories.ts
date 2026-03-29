import type { FastifyInstance } from "fastify";
import type { CreateRepositoryRequest, Repository, RepositoryListResponse } from "@openepis/types";
import type { Container } from "../container.js";
import { TOKENS } from "../container.js";
import { AppError } from "../errors.js";

export async function repositoryRoutes(
  app: FastifyInstance,
  opts: { container: Container },
): Promise<void> {
  const storage = opts.container.resolve(TOKENS.StorageService);

  app.get<{ Params: { id: string }; Reply: RepositoryListResponse }>(
    "/api/projects/:id/repositories",
    async (request, reply) => {
      const project = await storage.projects.findById(request.params.id);
      if (!project) throw new AppError(404, "NOT_FOUND", "Project not found");
      const repositories = await storage.repositories.findByProject(request.params.id);
      return reply.send({ repositories });
    },
  );

  app.post<{ Params: { id: string }; Body: CreateRepositoryRequest; Reply: Repository }>(
    "/api/projects/:id/repositories",
    async (request, reply) => {
      const project = await storage.projects.findById(request.params.id);
      if (!project) throw new AppError(404, "NOT_FOUND", "Project not found");
      const { name, git_url, default_branch } = request.body;
      const repository = await storage.repositories.create({
        project_id: request.params.id,
        name,
        git_url,
        default_branch: default_branch ?? "main",
        last_synced_at: null,
      });
      return reply.status(201).send(repository);
    },
  );

  app.delete<{ Params: { id: string } }>("/api/repositories/:id", async (request, reply) => {
    const repo = await storage.repositories.findById(request.params.id);
    if (!repo) throw new AppError(404, "NOT_FOUND", "Repository not found");
    await storage.repositories.delete(request.params.id);
    return reply.status(204).send();
  });
}
