import type { Repository } from "@openepis/types";
import type { CreateInput, UpdateInput } from "../types.js";

export interface IRepositoryStorage {
  findById(id: string): Promise<Repository | null>;
  findByProject(projectId: string): Promise<Repository[]>;
  create(data: CreateInput<Repository>): Promise<Repository>;
  update(id: string, data: UpdateInput<Repository>): Promise<Repository>;
  delete(id: string): Promise<void>;
}
