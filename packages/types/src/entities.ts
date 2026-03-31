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
  tool_calls?: Array<{ name: string; arguments: Record<string, unknown> }>;
}

export interface GeneratedChanges {
  new_features: Array<{
    temp_id: string;
    title: string;
    description: string;
    scenarios: Array<{
      title: string;
      steps: BddStep[];
      tags?: string[];
    }>;
    tags?: string[];
  }>;
  modified_features: Array<{
    feature_id: string;
    reason: string;
    updated_title?: string;
    updated_description?: string;
    added_scenarios?: Array<{
      title: string;
      steps: BddStep[];
      tags?: string[];
    }>;
    modified_scenarios?: Array<{
      scenario_id: string;
      updated_title?: string;
      updated_steps?: BddStep[];
    }>;
    removed_scenario_ids?: string[];
  }>;
}

export interface Conversation {
  id: string;
  project_id: string;
  messages: ConversationMessage[];
  status: "active" | "completed" | "cancelled";
  pending_changes: GeneratedChanges | null;
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
