export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: "pm" | "dev" | "viewer";
  created_at: string;
}

export interface Repository {
  id: string;
  project_id: string;
  name: string;
  git_url: string;
  default_branch: string;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BddStep {
  type: "given" | "and" | "when" | "then";
  text: string;
}

export interface Scenario {
  id: string;
  feature_id: string;
  title: string;
  steps: BddStep[];
  tags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Feature {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: "draft" | "active" | "deprecated";
  version: number;
  tags: string[];
  sort_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FeatureRevision {
  id: string;
  feature_id: string;
  version: number;
  snapshot: {
    title: string;
    description: string;
    status: string;
    scenarios: Array<{
      title: string;
      steps: BddStep[];
      tags: string[];
    }>;
  };
  change_summary: string;
  changed_by: string;
  created_at: string;
}

export interface PrdDocument {
  id: string;
  project_id: string;
  title: string;
  content: string;
  status: "draft" | "in_review" | "completed";
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  role: "system" | "assistant" | "user";
  content: string;
  timestamp: string;
}

export interface GeneratedChanges {
  new_features: Array<{
    title: string;
    scenarios: Array<{
      title: string;
      steps: BddStep[];
    }>;
  }>;
  modified_features: Array<{
    feature_id: string;
    changes: string;
  }>;
}

export interface Conversation {
  id: string;
  prd_id: string;
  project_id: string;
  messages: ConversationMessage[];
  status: "active" | "completed" | "cancelled";
  generated_changes: GeneratedChanges | null;
  created_at: string;
  updated_at: string;
}

export interface AsyncTask {
  id: string;
  project_id: string;
  type: "init_bdd" | "generate_bdd";
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  result: Record<string, unknown> | null;
  error: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface LlmConfig {
  id: string;
  scope: "platform" | "project";
  scope_id: string | null;
  provider: "claude" | "openai" | "ollama";
  model: string;
  api_key: string | null;
  base_url: string | null;
  provider_config: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
