import type { TaskStatusResponse } from "@openepis/types";
import type { HttpClient } from "../client.js";

export class TasksResource {
  constructor(private http: HttpClient) {}

  get(id: string): Promise<TaskStatusResponse> {
    return this.http.get(`/api/tasks/${id}`);
  }
}
