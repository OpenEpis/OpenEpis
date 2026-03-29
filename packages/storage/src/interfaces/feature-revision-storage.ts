import type { FeatureRevision } from "@openepis/types";
import type { CreateInput } from "../types.js";

export interface IFeatureRevisionStorage {
  findById(id: string): Promise<FeatureRevision | null>;
  findByFeature(featureId: string): Promise<FeatureRevision[]>;
  create(data: CreateInput<FeatureRevision>): Promise<FeatureRevision>;
}
