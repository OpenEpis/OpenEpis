import type { Scenario } from "@openepis/types";
import type { CreateInput, UpdateInput } from "../types.js";

export interface IScenarioStorage {
  findById(id: string): Promise<Scenario | null>;
  findByFeature(featureId: string): Promise<Scenario[]>;
  create(data: CreateInput<Scenario>): Promise<Scenario>;
  update(id: string, data: UpdateInput<Scenario>): Promise<Scenario>;
  delete(id: string): Promise<void>;
}
