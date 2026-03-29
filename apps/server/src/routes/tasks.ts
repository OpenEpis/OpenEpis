import type { FastifyInstance } from "fastify";
import type { TaskStatusResponse, AsyncTaskResponse } from "@openepis/types";
import type { Container } from "../container.js";
import { TOKENS } from "../container.js";
import { AppError } from "../errors.js";

export async function taskRoutes(
  app: FastifyInstance,
  opts: { container: Container },
): Promise<void> {
  const storage = opts.container.resolve(TOKENS.StorageService);

  app.get<{ Params: { id: string }; Reply: TaskStatusResponse }>(
    "/api/tasks/:id",
    async (request, reply) => {
      const task = await storage.asyncTasks.findById(request.params.id);
      if (!task) throw new AppError(404, "NOT_FOUND", "Task not found");
      const response: TaskStatusResponse = {
        id: task.id,
        type: task.type,
        status: task.status,
        progress: task.progress,
        created_at: task.created_at,
      };
      if (task.result) response.result = task.result;
      if (task.error) response.error = task.error;
      return reply.send(response);
    },
  );

  app.post<{
    Params: { id: string };
    Body: { repository_ids?: string[] };
    Reply: AsyncTaskResponse;
  }>("/api/projects/:id/init", async (request, reply) => {
    const project = await storage.projects.findById(request.params.id);
    if (!project) throw new AppError(404, "NOT_FOUND", "Project not found");

    const task = await storage.asyncTasks.create({
      project_id: request.params.id,
      type: "init_bdd",
      status: "queued",
      progress: 0,
      result: null,
      error: null,
      created_by: "system",
    });

    return reply.status(202).send({
      task_id: task.id,
      status: "queued",
    });
  });
}
