import type { LlmConfig } from "@openepis/types";
import type { CreateInput, UpdateInput } from "../types.js";

export interface ILlmConfigStorage {
  findById(id: string): Promise<LlmConfig | null>;
  findByScope(scope: "platform" | "project", scopeId?: string): Promise<LlmConfig[]>;
  create(data: CreateInput<LlmConfig>): Promise<LlmConfig>;
  update(id: string, data: UpdateInput<LlmConfig>): Promise<LlmConfig>;
  delete(id: string): Promise<void>;
}
