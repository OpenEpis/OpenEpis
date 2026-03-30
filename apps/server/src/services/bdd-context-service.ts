import type { IBddContextService, FeatureDetail, FeatureSummary } from "@openepis/core";
import type { IStorageService } from "@openepis/storage";

export class BddContextServiceImpl implements IBddContextService {
  constructor(private storage: IStorageService) {}

  async getFeatureDetail(featureId: string): Promise<FeatureDetail | null> {
    const feature = await this.storage.features.findById(featureId);
    if (!feature) return null;
    const scenarios = await this.storage.scenarios.findByFeature(featureId);
    return {
      id: feature.id,
      title: feature.title,
      description: feature.description,
      tags: feature.tags,
      scenarios: scenarios.map((s) => ({
        id: s.id,
        title: s.title,
        steps: s.steps,
        tags: s.tags,
      })),
    };
  }

  async searchFeatures(projectId: string, query: string): Promise<FeatureSummary[]> {
    const features = await this.storage.features.findByProject(projectId);
    const q = query.toLowerCase();
    const matched = features.filter(
      (f) => f.title.toLowerCase().includes(q) || f.description.toLowerCase().includes(q),
    );
    const results: FeatureSummary[] = [];
    for (const f of matched) {
      const scenarios = await this.storage.scenarios.findByFeature(f.id);
      results.push({
        id: f.id,
        title: f.title,
        description: f.description,
        tags: f.tags,
        scenarioCount: scenarios.length,
      });
    }
    return results;
  }
}
