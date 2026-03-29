import type { Project, Feature, Scenario, Repository, BddStep } from "./entities.js";

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export interface ProjectListResponse {
  projects: Array<
    Pick<Project, "id" | "name" | "created_at"> & {
      feature_count: number;
    }
  >;
}

export interface ProjectDetailResponse extends Project {
  repo_count: number;
  feature_count: number;
}

export interface FeatureListResponse {
  features: Array<
    Pick<Feature, "id" | "title" | "description" | "status" | "version" | "tags" | "updated_at"> & {
      scenario_count: number;
    }
  >;
}

export interface FeatureDetailResponse extends Pick<
  Feature,
  "id" | "title" | "description" | "status" | "version" | "tags" | "updated_at"
> {
  scenarios: Array<
    Pick<Scenario, "id" | "title" | "tags"> & {
      steps: BddStep[];
    }
  >;
}

export interface FeatureRevisionsResponse {
  revisions: Array<{
    version: number;
    change_summary: string;
    changed_by: { id: string; name: string };
    created_at: string;
  }>;
}

export interface ContextResponse {
  related_features: Array<{
    id: string;
    title: string;
    relevance: "high" | "medium" | "low";
    related_scenarios: string[];
  }>;
}

export interface TaskStatusResponse {
  id: string;
  type: string;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  result?: Record<string, unknown>;
  error?: string;
  created_at: string;
}

export interface AsyncTaskResponse {
  task_id: string;
  status: "queued";
}

export interface RepositoryListResponse {
  repositories: Repository[];
}
