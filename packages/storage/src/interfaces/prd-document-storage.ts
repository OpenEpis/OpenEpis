import type { PrdDocument } from "@openepis/types";
import type { CreateInput, UpdateInput } from "../types.js";

export interface IPrdDocumentStorage {
  findById(id: string): Promise<PrdDocument | null>;
  findByProject(projectId: string): Promise<PrdDocument[]>;
  create(data: CreateInput<PrdDocument>): Promise<PrdDocument>;
  update(id: string, data: UpdateInput<PrdDocument>): Promise<PrdDocument>;
  delete(id: string): Promise<void>;
}
