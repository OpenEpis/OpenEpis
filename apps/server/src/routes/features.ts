import type { FastifyInstance } from "fastify";
import type {
  CreateFeatureRequest,
  UpdateFeatureRequest,
  FeatureListResponse,
  FeatureDetailResponse,
  FeatureRevisionsResponse,
  Feature,
} from "@openepis/types";
import type { Container } from "../container.js";
import { TOKENS } from "../container.js";
import { AppError } from "../errors.js";

export async function featureRoutes(
  app: FastifyInstance,
  opts: { container: Container },
): Promise<void> {
  const storage = opts.container.resolve(TOKENS.StorageService);

  app.get<{
    Params: { id: string };
    Querystring: { status?: string; tag?: string; search?: string };
    Reply: FeatureListResponse;
  }>("/api/projects/:id/features", async (request, reply) => {
    let allFeatures = await storage.features.findByProject(request.params.id);
    const { status, tag, search } = request.query;

    if (status) {
      allFeatures = allFeatures.filter((f) => f.status === status);
    }
    if (tag) {
      allFeatures = allFeatures.filter((f) => f.tags.includes(tag));
    }
    if (search) {
      const q = search.toLowerCase();
      allFeatures = allFeatures.filter(
        (f) => f.title.toLowerCase().includes(q) || f.description.toLowerCase().includes(q),
      );
    }

    const features: FeatureListResponse["features"] = [];
    for (const f of allFeatures) {
      const scenarios = await storage.scenarios.findByFeature(f.id);
      features.push({
        id: f.id,
        title: f.title,
        description: f.description,
        status: f.status,
        version: f.version,
        tags: f.tags,
        updated_at: f.updated_at,
        scenario_count: scenarios.length,
      });
    }

    return reply.send({ features });
  });

  app.get<{ Params: { id: string }; Reply: FeatureDetailResponse }>(
    "/api/features/:id",
    async (request, reply) => {
      const feature = await storage.features.findById(request.params.id);
      if (!feature) throw new AppError(404, "NOT_FOUND", "Feature not found");
      const scenarios = await storage.scenarios.findByFeature(feature.id);
      return reply.send({
        id: feature.id,
        title: feature.title,
        description: feature.description,
        status: feature.status,
        version: feature.version,
        tags: feature.tags,
        updated_at: feature.updated_at,
        scenarios: scenarios.map((s) => ({
          id: s.id,
          title: s.title,
          tags: s.tags,
          steps: s.steps,
        })),
      });
    },
  );

  app.post<{ Params: { id: string }; Body: CreateFeatureRequest; Reply: Feature }>(
    "/api/projects/:id/features",
    async (request, reply) => {
      const project = await storage.projects.findById(request.params.id);
      if (!project) throw new AppError(404, "NOT_FOUND", "Project not found");

      const { title, description, scenarios, tags } = request.body;
      const feature = await storage.features.create({
        project_id: request.params.id,
        title,
        description: description ?? "",
        status: "draft",
        version: 1,
        tags: tags ?? [],
        sort_order: 0,
        created_by: "system",
      });

      if (scenarios) {
        for (let i = 0; i < scenarios.length; i++) {
          const s = scenarios[i];
          await storage.scenarios.create({
            feature_id: feature.id,
            title: s.title,
            steps: s.steps,
            tags: s.tags ?? [],
            sort_order: i,
          });
        }
      }

      // Create initial revision
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
        change_summary: "Initial version",
        changed_by: "system",
      });

      return reply.status(201).send(feature);
    },
  );

  app.put<{ Params: { id: string }; Body: UpdateFeatureRequest; Reply: Feature }>(
    "/api/features/:id",
    async (request, reply) => {
      const existing = await storage.features.findById(request.params.id);
      if (!existing) throw new AppError(404, "NOT_FOUND", "Feature not found");

      const { title, description, status, scenarios, tags } = request.body;
      const newVersion = existing.version + 1;

      const feature = await storage.features.update(request.params.id, {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(tags !== undefined && { tags }),
        version: newVersion,
      });

      if (scenarios !== undefined) {
        // Delete existing scenarios and replace
        const existingScenarios = await storage.scenarios.findByFeature(feature.id);
        for (const s of existingScenarios) {
          await storage.scenarios.delete(s.id);
        }
        for (let i = 0; i < scenarios.length; i++) {
          const s = scenarios[i];
          await storage.scenarios.create({
            feature_id: feature.id,
            title: s.title,
            steps: s.steps,
            tags: s.tags ?? [],
            sort_order: i,
          });
        }
      }

      // Create revision snapshot
      const updatedScenarios = await storage.scenarios.findByFeature(feature.id);
      await storage.featureRevisions.create({
        feature_id: feature.id,
        version: newVersion,
        snapshot: {
          title: feature.title,
          description: feature.description,
          status: feature.status,
          scenarios: updatedScenarios.map((s) => ({
            title: s.title,
            steps: s.steps,
            tags: s.tags,
          })),
        },
        change_summary: `Updated to version ${newVersion}`,
        changed_by: "system",
      });

      return reply.send(feature);
    },
  );

  app.get<{ Params: { id: string }; Reply: FeatureRevisionsResponse }>(
    "/api/features/:id/revisions",
    async (request, reply) => {
      const feature = await storage.features.findById(request.params.id);
      if (!feature) throw new AppError(404, "NOT_FOUND", "Feature not found");

      const revisions = await storage.featureRevisions.findByFeature(feature.id);
      return reply.send({
        revisions: revisions.map((r) => ({
          version: r.version,
          change_summary: r.change_summary,
          changed_by: { id: r.changed_by, name: r.changed_by },
          created_at: r.created_at,
        })),
      });
    },
  );

  app.get<{
    Params: { id: string; version: string };
    Reply: FeatureDetailResponse;
  }>("/api/features/:id/revisions/:version", async (request, reply) => {
    const feature = await storage.features.findById(request.params.id);
    if (!feature) throw new AppError(404, "NOT_FOUND", "Feature not found");

    const revisions = await storage.featureRevisions.findByFeature(feature.id);
    const version = parseInt(request.params.version, 10);
    const revision = revisions.find((r) => r.version === version);
    if (!revision) throw new AppError(404, "NOT_FOUND", "Revision not found");

    return reply.send({
      id: feature.id,
      title: revision.snapshot.title,
      description: revision.snapshot.description,
      status: revision.snapshot.status as Feature["status"],
      version: revision.version,
      tags: feature.tags,
      updated_at: revision.created_at,
      scenarios: revision.snapshot.scenarios.map((s, i) => ({
        id: `${feature.id}-rev-${revision.version}-${i}`,
        title: s.title,
        tags: s.tags,
        steps: s.steps,
      })),
    });
  });
}
