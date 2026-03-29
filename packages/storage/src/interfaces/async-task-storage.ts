import type { AsyncTask } from "@openepis/types";
import type { CreateInput, UpdateInput } from "../types.js";

export interface IAsyncTaskStorage {
  findById(id: string): Promise<AsyncTask | null>;
  findByProject(projectId: string): Promise<AsyncTask[]>;
  create(data: CreateInput<AsyncTask>): Promise<AsyncTask>;
  update(id: string, data: UpdateInput<AsyncTask>): Promise<AsyncTask>;
  delete(id: string): Promise<void>;
}
