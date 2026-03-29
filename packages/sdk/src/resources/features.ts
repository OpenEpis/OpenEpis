import type {
  CreateFeatureRequest,
  UpdateFeatureRequest,
  FeatureListResponse,
  FeatureDetailResponse,
  FeatureRevisionsResponse,
  Feature,
} from "@openepis/types";
import type { HttpClient } from "../client.js";

export interface FeatureListQuery {
  status?: "draft" | "active" | "deprecated";
  tag?: string;
  search?: string;
}

export class FeaturesResource {
  constructor(private http: HttpClient) {}

  list(projectId: string, query?: FeatureListQuery): Promise<FeatureListResponse> {
    const params = new URLSearchParams();
    if (query?.status) params.set("status", query.status);
    if (query?.tag) params.set("tag", query.tag);
    if (query?.search) params.set("search", query.search);
    const qs = params.toString();
    return this.http.get(`/api/projects/${projectId}/features${qs ? `?${qs}` : ""}`);
  }

  get(id: string): Promise<FeatureDetailResponse> {
    return this.http.get(`/api/features/${id}`);
  }

  create(projectId: string, data: CreateFeatureRequest): Promise<Feature> {
    return this.http.post(`/api/projects/${projectId}/features`, data);
  }

  update(id: string, data: UpdateFeatureRequest): Promise<Feature> {
    return this.http.put(`/api/features/${id}`, data);
  }

  revisions(id: string): Promise<FeatureRevisionsResponse> {
    return this.http.get(`/api/features/${id}/revisions`);
  }

  revision(id: string, version: number): Promise<FeatureDetailResponse> {
    return this.http.get(`/api/features/${id}/revisions/${version}`);
  }
}
