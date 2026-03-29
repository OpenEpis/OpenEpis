import type { CreateRepositoryRequest, Repository, RepositoryListResponse } from "@openepis/types";
import type { HttpClient } from "../client.js";

export class RepositoriesResource {
  constructor(private http: HttpClient) {}

  list(projectId: string): Promise<RepositoryListResponse> {
    return this.http.get(`/api/projects/${projectId}/repositories`);
  }

  create(projectId: string, data: CreateRepositoryRequest): Promise<Repository> {
    return this.http.post(`/api/projects/${projectId}/repositories`, data);
  }

  delete(id: string): Promise<void> {
    return this.http.delete(`/api/repositories/${id}`);
  }
}
