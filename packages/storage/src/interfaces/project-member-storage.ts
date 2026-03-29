import type { ProjectMember } from "@openepis/types";
import type { CreateInput, UpdateInput } from "../types.js";

export interface IProjectMemberStorage {
  findById(id: string): Promise<ProjectMember | null>;
  findByProject(projectId: string): Promise<ProjectMember[]>;
  create(data: CreateInput<ProjectMember>): Promise<ProjectMember>;
  update(id: string, data: UpdateInput<ProjectMember>): Promise<ProjectMember>;
  delete(id: string): Promise<void>;
}
