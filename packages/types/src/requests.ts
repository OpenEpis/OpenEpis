export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

export interface CreateRepositoryRequest {
  name: string;
  git_url: string;
  default_branch?: string;
  access_token?: string;
}

export interface CreateFeatureRequest {
  title: string;
  description?: string;
  scenarios?: Array<{
    title: string;
    steps: Array<{ type: "given" | "and" | "when" | "then"; text: string }>;
    tags?: string[];
  }>;
  tags?: string[];
}

export interface UpdateFeatureRequest {
  title?: string;
  description?: string;
  status?: "draft" | "active" | "deprecated";
  scenarios?: Array<{
    id?: string;
    title: string;
    steps: Array<{ type: "given" | "and" | "when" | "then"; text: string }>;
    tags?: string[];
  }>;
  tags?: string[];
}

export interface InitBddRequest {
  repository_ids?: string[];
}

export interface PostContextRequest {
  file_path: string;
  repository: string;
}
