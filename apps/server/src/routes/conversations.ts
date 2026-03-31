import type { FastifyInstance } from "fastify";
import type { Conversation, GeneratedChanges } from "@openepis/types";
import type { SSEMessage } from "@fastify/sse";
import {
  createBddAgent,
  mergeChanges,
  fromPiMessages,
  type FeatureSummary,
  type ModelConfig,
} from "@openepis/core";
import type { Container } from "../container.js";
import { TOKENS } from "../container.js";
import { AppError } from "../errors.js";
import { BddContextServiceImpl } from "../services/bdd-context-service.js";

export async function conversationRoutes(
  app: FastifyInstance,
  opts: { container: Container },
): Promise<void> {
  const storage = opts.container.resolve(TOKENS.StorageService);

  // POST /api/projects/:projectId/conversations — create conversation
  app.post<{ Params: { projectId: string }; Reply: Conversation }>(
    "/api/projects/:projectId/conversations",
    async (request, reply) => {
      const project = await storage.projects.findById(request.params.projectId);
      if (!project) throw new AppError(404, "PROJECT_NOT_FOUND", "Project not found");

      const conversation = await storage.conversations.create({
        project_id: request.params.projectId,
        messages: [],
        status: "active",
        pending_changes: null,
      });

      return reply.status(201).send(conversation);
    },
  );

  // GET /api/projects/:projectId/conversations — list conversations
  app.get<{
    Params: { projectId: string };
    Reply: {
      conversations: Array<{
        id: string;
        status: string;
        created_at: string;
        updated_at: string;
        message_count: number;
      }>;
    };
  }>("/api/projects/:projectId/conversations", async (request, reply) => {
    const convos = await storage.conversations.findByProject(request.params.projectId);
    return reply.send({
      conversations: convos.map((c) => ({
        id: c.id,
        status: c.status,
        created_at: c.created_at,
        updated_at: c.updated_at,
        message_count: c.messages.length,
      })),
    });
  });

  // GET /api/conversations/:id — get conversation detail
  app.get<{ Params: { id: string }; Reply: Conversation }>(
    "/api/conversations/:id",
    async (request, reply) => {
      const conversation = await storage.conversations.findById(request.params.id);
      if (!conversation)
        throw new AppError(404, "CONVERSATION_NOT_FOUND", "Conversation not found");
      return reply.send(conversation);
    },
  );

  // DELETE /api/conversations/:id — delete conversation
  app.delete<{ Params: { id: string } }>("/api/conversations/:id", async (request, reply) => {
    const conversation = await storage.conversations.findById(request.params.id);
    if (!conversation) throw new AppError(404, "CONVERSATION_NOT_FOUND", "Conversation not found");
    await storage.conversations.delete(request.params.id);
    return reply.status(204).send();
  });

  // POST /api/conversations/:id/messages — streaming message endpoint (SSE)
  app.post<{ Params: { id: string }; Body: { content: string } }>(
    "/api/conversations/:id/messages",
    { sse: true },
    async (request, reply) => {
      const conv = await storage.conversations.findById(request.params.id);
      if (!conv) throw new AppError(404, "CONVERSATION_NOT_FOUND", "Conversation not found");
      if (conv.status !== "active")
        throw new AppError(400, "CONVERSATION_NOT_ACTIVE", "Conversation is not active");

      const { content } = request.body;
      if (!content) throw new AppError(400, "VALIDATION_ERROR", "content is required");

      const conversationId = conv.id;
      const projectId = conv.project_id;

      const project = await storage.projects.findById(projectId);
      if (!project) throw new AppError(500, "INTERNAL_ERROR", "Project not found");

      // Resolve LLM config: project-level first, then platform-level
      const projectConfigs = await storage.llmConfigs.findByScope("project", projectId);
      let llmConfig = projectConfigs.find((c) => c.is_active);
      if (!llmConfig) {
        const platformConfigs = await storage.llmConfigs.findByScope("platform");
        llmConfig = platformConfigs.find((c) => c.is_active);
      }
      if (!llmConfig) throw new AppError(500, "LLM_CONFIG_MISSING", "No active LLM config found");

      // Assemble feature index (Layer 1)
      const allFeatures = await storage.features.findByProject(projectId);
      const featureIndex: FeatureSummary[] = [];
      for (const f of allFeatures) {
        const scenarios = await storage.scenarios.findByFeature(f.id);
        featureIndex.push({
          id: f.id,
          title: f.title,
          description: f.description,
          tags: f.tags,
          scenarioCount: scenarios.length,
        });
      }

      // Build model config
      const modelConfig: ModelConfig = {
        provider: llmConfig.provider,
        modelId: llmConfig.model,
        apiKey: llmConfig.api_key ?? "",
        baseUrl: llmConfig.base_url ?? undefined,
        providerConfig: llmConfig.provider_config ?? undefined,
      };

      // Create context service and agent
      // NOTE: Don't add the user message to initial messages here —
      // agent.prompt(content) will add it automatically.
      const contextService = new BddContextServiceImpl(storage);
      const agent = createBddAgent({
        projectId,
        projectName: project.name,
        featureIndex,
        relatedFeatures: [],
        messages: conv.messages,
        pendingChanges: conv.pending_changes,
        model: modelConfig,
        contextService,
        maxSteps: 10,
      });

      let pendingChanges = conv.pending_changes;

      // SSE async generator
      async function* agentEvents(): AsyncGenerator<SSEMessage> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eventQueue: any[] = [];
        let resolveWait: (() => void) | null = null;
        let done = false;

        const unsub = agent.subscribe((event) => {
          eventQueue.push(event);
          if (resolveWait) {
            resolveWait();
            resolveWait = null;
          }
        });

        // Start the agent with user message
        agent.prompt(content).catch(() => {
          // Error handled via agent_end or catch below
        });

        try {
          while (true) {
            if (eventQueue.length === 0) {
              if (done) break;
              await new Promise<void>((r) => {
                resolveWait = r;
              });
            }

            while (eventQueue.length > 0) {
              const event = eventQueue.shift()!;

              if (event.type === "message_update") {
                const ame = event.assistantMessageEvent;
                if (ame.type === "text_delta") {
                  yield {
                    event: "text-delta",
                    data: { delta: ame.delta },
                  };
                }
              } else if (event.type === "tool_execution_end" && event.toolName === "update_bdd") {
                if (!event.isError && event.result?.details) {
                  pendingChanges = mergeChanges(
                    pendingChanges,
                    event.result.details.changes as GeneratedChanges,
                  );
                  yield {
                    event: "bdd-change",
                    data: { changes: pendingChanges },
                  };
                }
              } else if (event.type === "agent_end") {
                // agent_end.messages only contains the current turn's messages,
                // not the full conversation history. Append them to existing messages.
                const newMessages = fromPiMessages(event.messages);
                const updatedMessages = [...conv.messages, ...newMessages];
                await storage.conversations.update(conversationId, {
                  messages: updatedMessages,
                  pending_changes: pendingChanges,
                });

                yield {
                  event: "done",
                  data: { message_id: conversationId },
                };
                done = true;
              }
            }
          }
        } catch (err) {
          yield {
            event: "error",
            data: { message: err instanceof Error ? err.message : "Agent error" },
          };
        } finally {
          unsub();
        }
      }

      await reply.sse.send(agentEvents());
    },
  );

  // POST /api/conversations/:id/apply — apply pending changes
  app.post<{ Params: { id: string } }>("/api/conversations/:id/apply", async (request, reply) => {
    const conversation = await storage.conversations.findById(request.params.id);
    if (!conversation) throw new AppError(404, "CONVERSATION_NOT_FOUND", "Conversation not found");
    if (!conversation.pending_changes)
      throw new AppError(400, "NO_PENDING_CHANGES", "No pending changes to apply");

    const changes = conversation.pending_changes;
    const appliedFeatures: string[] = [];

    // Create new features
    for (const newFeature of changes.new_features) {
      const feature = await storage.features.create({
        project_id: conversation.project_id,
        title: newFeature.title,
        description: newFeature.description,
        status: "draft",
        version: 1,
        tags: newFeature.tags ?? [],
        sort_order: 0,
        created_by: request.user.id,
      });

      for (let i = 0; i < newFeature.scenarios.length; i++) {
        const s = newFeature.scenarios[i];
        await storage.scenarios.create({
          feature_id: feature.id,
          title: s.title,
          steps: s.steps,
          tags: s.tags ?? [],
          sort_order: i,
        });
      }

      // Create revision
      const featureScenarios = await storage.scenarios.findByFeature(feature.id);
      await storage.featureRevisions.create({
        feature_id: feature.id,
        version: 1,
        snapshot: {
          title: feature.title,
          description: feature.description,
          status: feature.status,
          scenarios: featureScenarios.map((s) => ({
            title: s.title,
            steps: s.steps,
            tags: s.tags,
          })),
        },
        change_summary: "Created from conversation",
        changed_by: request.user.id,
      });

      appliedFeatures.push(feature.id);
    }

    // Modify existing features
    for (const mod of changes.modified_features) {
      const existing = await storage.features.findById(mod.feature_id);
      if (!existing) continue;

      const newVersion = existing.version + 1;
      await storage.features.update(mod.feature_id, {
        ...(mod.updated_title !== undefined && { title: mod.updated_title }),
        ...(mod.updated_description !== undefined && { description: mod.updated_description }),
        version: newVersion,
      });

      // Add new scenarios
      if (mod.added_scenarios) {
        const existingScenarios = await storage.scenarios.findByFeature(mod.feature_id);
        for (let i = 0; i < mod.added_scenarios.length; i++) {
          const s = mod.added_scenarios[i];
          await storage.scenarios.create({
            feature_id: mod.feature_id,
            title: s.title,
            steps: s.steps,
            tags: s.tags ?? [],
            sort_order: existingScenarios.length + i,
          });
        }
      }

      // Modify existing scenarios
      if (mod.modified_scenarios) {
        for (const ms of mod.modified_scenarios) {
          await storage.scenarios.update(ms.scenario_id, {
            ...(ms.updated_title !== undefined && { title: ms.updated_title }),
            ...(ms.updated_steps !== undefined && { steps: ms.updated_steps }),
          });
        }
      }

      // Remove scenarios
      if (mod.removed_scenario_ids) {
        for (const sid of mod.removed_scenario_ids) {
          await storage.scenarios.delete(sid);
        }
      }

      // Create revision
      const updatedFeature = await storage.features.findById(mod.feature_id);
      const updatedScenarios = await storage.scenarios.findByFeature(mod.feature_id);
      if (updatedFeature) {
        await storage.featureRevisions.create({
          feature_id: mod.feature_id,
          version: newVersion,
          snapshot: {
            title: updatedFeature.title,
            description: updatedFeature.description,
            status: updatedFeature.status,
            scenarios: updatedScenarios.map((s) => ({
              title: s.title,
              steps: s.steps,
              tags: s.tags,
            })),
          },
          change_summary: mod.reason || "Modified from conversation",
          changed_by: request.user.id,
        });
      }

      appliedFeatures.push(mod.feature_id);
    }

    // Clear pending changes
    await storage.conversations.update(conversation.id, {
      pending_changes: null,
    });

    return reply.send({ applied_features: appliedFeatures });
  });

  // POST /api/conversations/:id/discard — discard pending changes
  app.post<{ Params: { id: string } }>("/api/conversations/:id/discard", async (request, reply) => {
    const conversation = await storage.conversations.findById(request.params.id);
    if (!conversation) throw new AppError(404, "CONVERSATION_NOT_FOUND", "Conversation not found");

    await storage.conversations.update(conversation.id, {
      pending_changes: null,
    });

    return reply.send({ ok: true });
  });
}
