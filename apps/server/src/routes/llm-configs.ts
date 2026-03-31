import type { FastifyInstance } from "fastify";
import type { LlmConfig } from "@openepis/types";
import type { Container } from "../container.js";
import { TOKENS } from "../container.js";
import { AppError } from "../errors.js";

export async function llmConfigRoutes(
  app: FastifyInstance,
  opts: { container: Container },
): Promise<void> {
  const storage = opts.container.resolve(TOKENS.StorageService);

  app.get<{ Querystring: { scope?: string; scope_id?: string } }>(
    "/api/llm-configs",
    async (request, reply) => {
      const { scope, scope_id } = request.query;
      if (scope && scope !== "platform" && scope !== "project") {
        throw new AppError(400, "VALIDATION_ERROR", "scope must be 'platform' or 'project'");
      }
      const configs = scope
        ? await storage.llmConfigs.findByScope(scope as "platform" | "project", scope_id)
        : await storage.llmConfigs.findByScope("platform");
      return reply.send({ configs });
    },
  );

  app.get<{ Params: { id: string } }>("/api/llm-configs/:id", async (request, reply) => {
    const config = await storage.llmConfigs.findById(request.params.id);
    if (!config) throw new AppError(404, "NOT_FOUND", "LLM config not found");
    return reply.send(config);
  });

  app.post<{
    Body: {
      scope: "platform" | "project";
      scope_id?: string;
      provider: "claude" | "openai" | "ollama";
      model: string;
      api_key?: string;
      base_url?: string;
      provider_config?: Record<string, unknown>;
      is_active?: boolean;
    };
    Reply: LlmConfig;
  }>("/api/llm-configs", async (request, reply) => {
    const { scope, scope_id, provider, model, api_key, base_url, provider_config, is_active } =
      request.body;
    if (!scope || !provider || !model) {
      throw new AppError(400, "VALIDATION_ERROR", "scope, provider, and model are required");
    }
    const config = await storage.llmConfigs.create({
      scope,
      scope_id: scope_id ?? null,
      provider,
      model,
      api_key: api_key ?? null,
      base_url: base_url ?? null,
      provider_config: provider_config ?? null,
      is_active: is_active ?? true,
    });
    return reply.status(201).send(config);
  });

  app.put<{
    Params: { id: string };
    Body: Partial<{
      provider: "claude" | "openai" | "ollama";
      model: string;
      api_key: string;
      base_url: string;
      provider_config: Record<string, unknown>;
      is_active: boolean;
    }>;
    Reply: LlmConfig;
  }>("/api/llm-configs/:id", async (request, reply) => {
    const existing = await storage.llmConfigs.findById(request.params.id);
    if (!existing) throw new AppError(404, "NOT_FOUND", "LLM config not found");
    const config = await storage.llmConfigs.update(request.params.id, request.body);
    return reply.send(config);
  });

  app.delete<{ Params: { id: string } }>("/api/llm-configs/:id", async (request, reply) => {
    const existing = await storage.llmConfigs.findById(request.params.id);
    if (!existing) throw new AppError(404, "NOT_FOUND", "LLM config not found");
    await storage.llmConfigs.delete(request.params.id);
    return reply.status(204).send();
  });
}
