import type { Conversation } from "@openepis/types";
import type { CreateInput, UpdateInput } from "../types.js";

export interface IConversationStorage {
  findById(id: string): Promise<Conversation | null>;
  findByProject(projectId: string): Promise<Conversation[]>;
  create(data: CreateInput<Conversation>): Promise<Conversation>;
  update(id: string, data: UpdateInput<Conversation>): Promise<Conversation>;
  delete(id: string): Promise<void>;
}
