import type { FastifyInstance } from "fastify";
import type {
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectListResponse,
  ProjectDetailResponse,
  Project,
} from "@openepis/types";
import type { Container } from "../container.js";
import { TOKENS } from "../container.js";
import { AppError } from "../errors.js";

export async function projectRoutes(
  app: FastifyInstance,
  opts: { container: Container },
): Promise<void> {
  const storage = opts.container.resolve(TOKENS.StorageService);

  app.get<{ Reply: ProjectListResponse }>("/api/projects", async (_request, reply) => {
    const allProjects = await storage.projects.findAll();
    const projects: ProjectListResponse["projects"] = [];
    for (const p of allProjects) {
      const features = await storage.features.findByProject(p.id);
      projects.push({
        id: p.id,
        name: p.name,
        created_at: p.created_at,
        feature_count: features.length,
      });
    }
    return reply.send({ projects });
  });

  app.get<{ Params: { id: string }; Reply: ProjectDetailResponse }>(
    "/api/projects/:id",
    async (request, reply) => {
      const project = await storage.projects.findById(request.params.id);
      if (!project) throw new AppError(404, "NOT_FOUND", "Project not found");
      const repos = await storage.repositories.findByProject(project.id);
      const features = await storage.features.findByProject(project.id);
      return reply.send({
        ...project,
        repo_count: repos.length,
        feature_count: features.length,
      });
    },
  );

  app.post<{ Body: CreateProjectRequest; Reply: Project }>(
    "/api/projects",
    async (request, reply) => {
      const { name, description } = request.body;
      if (!name) throw new AppError(400, "VALIDATION_ERROR", "name is required");
      const project = await storage.projects.create({
        name,
        description: description ?? null,
        created_by: request.user.id,
      });
      return reply.status(201).send(project);
    },
  );

  app.put<{ Params: { id: string }; Body: UpdateProjectRequest; Reply: Project }>(
    "/api/projects/:id",
    async (request, reply) => {
      const existing = await storage.projects.findById(request.params.id);
      if (!existing) throw new AppError(404, "NOT_FOUND", "Project not found");
      const project = await storage.projects.update(request.params.id, request.body);
      return reply.send(project);
    },
  );

  app.delete<{ Params: { id: string } }>("/api/projects/:id", async (request, reply) => {
    const existing = await storage.projects.findById(request.params.id);
    if (!existing) throw new AppError(404, "NOT_FOUND", "Project not found");
    await storage.projects.delete(request.params.id);
    return reply.status(204).send();
  });
}
