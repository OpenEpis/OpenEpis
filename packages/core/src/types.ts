import type { AgentTool } from "@mariozechner/pi-agent-core";
import type { BddStep, GeneratedChanges, ConversationMessage } from "@openepis/types";
import type { LoadedPrompts } from "./datadir/prompt-loader.js";

/** Feature summary — for search results and Layer 1 index */
export interface FeatureSummary {
  id: string;
  title: string;
  description: string;
  tags: string[];
  scenarioCount: number;
}

/** Feature full detail — for Layer 2/3 context and get_feature_detail */
export interface FeatureDetail {
  id: string;
  title: string;
  description: string;
  tags: string[];
  scenarios: Array<{
    id: string;
    title: string;
    steps: BddStep[];
    tags: string[];
  }>;
}

/** The read-only context service that core needs from outside */
export interface IBddContextService {
  /** Get Feature with all Scenarios by ID */
  getFeatureDetail(featureId: string): Promise<FeatureDetail | null>;

  /** Search Features by keyword within a project */
  searchFeatures(projectId: string, query: string): Promise<FeatureSummary[]>;
}

/** LLM model configuration passed from server */
export interface ModelConfig {
  provider: string;
  modelId: string;
  apiKey: string;
  baseUrl?: string;
  providerConfig?: Record<string, unknown>;
}

/** Options for creating a BDD agent */
export interface BddAgentOptions {
  projectId: string;
  projectName: string;
  prompts: LoadedPrompts;
  featureIndex: FeatureSummary[];
  relatedFeatures: FeatureDetail[];
  prdContent?: string;
  messages: ConversationMessage[];
  pendingChanges: GeneratedChanges | null;
  model: ModelConfig;
  contextService: IBddContextService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  externalTools?: AgentTool<any>[];
  skillInstructions?: Array<{ name: string; instructions: string }>;
  maxSteps?: number;
}
