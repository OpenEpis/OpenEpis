import type { InitBddRequest, AsyncTaskResponse } from "@openepis/types";
import type { HttpClient } from "../client.js";

export class InitResource {
  constructor(private http: HttpClient) {}

  trigger(projectId: string, data?: InitBddRequest): Promise<AsyncTaskResponse> {
    return this.http.post(`/api/projects/${projectId}/init`, data);
  }
}
