import type {
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectListResponse,
  ProjectDetailResponse,
  Project,
} from "@openepis/types";
import type { HttpClient } from "../client.js";

export class ProjectsResource {
  constructor(private http: HttpClient) {}

  list(): Promise<ProjectListResponse> {
    return this.http.get("/api/projects");
  }

  get(id: string): Promise<ProjectDetailResponse> {
    return this.http.get(`/api/projects/${id}`);
  }

  create(data: CreateProjectRequest): Promise<Project> {
    return this.http.post("/api/projects", data);
  }

  update(id: string, data: UpdateProjectRequest): Promise<Project> {
    return this.http.put(`/api/projects/${id}`, data);
  }

  delete(id: string): Promise<void> {
    return this.http.delete(`/api/projects/${id}`);
  }
}
