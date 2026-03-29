import type { Project } from "@openepis/types";
import type { CreateInput, UpdateInput } from "../types.js";

export interface IProjectStorage {
  findAll(): Promise<Project[]>;
  findById(id: string): Promise<Project | null>;
  findByUser(userId: string): Promise<Project[]>;
  create(data: CreateInput<Project>): Promise<Project>;
  update(id: string, data: UpdateInput<Project>): Promise<Project>;
  delete(id: string): Promise<void>;
}
