import type { PostContextRequest, ContextResponse } from "@openepis/types";
import type { HttpClient } from "../client.js";

export class ContextResource {
  constructor(private http: HttpClient) {}

  query(projectId: string, data: PostContextRequest): Promise<ContextResponse> {
    return this.http.post(`/api/projects/${projectId}/context`, data);
  }
}
