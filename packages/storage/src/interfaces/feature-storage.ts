import type { Feature } from "@openepis/types";
import type { CreateInput, UpdateInput } from "../types.js";

export interface IFeatureStorage {
  findById(id: string): Promise<Feature | null>;
  findByProject(projectId: string): Promise<Feature[]>;
  create(data: CreateInput<Feature>): Promise<Feature>;
  update(id: string, data: UpdateInput<Feature>): Promise<Feature>;
  delete(id: string): Promise<void>;
}
