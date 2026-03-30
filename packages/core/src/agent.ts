import { Agent } from "@mariozechner/pi-agent-core";
import { getModel } from "@mariozechner/pi-ai";
import type { Api, Model } from "@mariozechner/pi-ai";
import type { BddAgentOptions } from "./types.js";
import { buildSystemPrompt } from "./prompt/system-prompt.js";
import { createTools } from "./tools/index.js";
import { toPiMessages } from "./context/convert.js";
import { transformContext } from "./context/transform.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModel = Model<any>;

const getModelDynamic = getModel as (provider: string, modelId: string) => AnyModel;

/**
 * Create a configured BDD agent instance.
 *
 * The agent is ready to receive prompts via `agent.prompt(userMessage)`.
 * Subscribe to events via `agent.subscribe(handler)` before prompting.
 */
export function createBddAgent(options: BddAgentOptions): Agent {
  const {
    projectId,
    projectName,
    featureIndex,
    relatedFeatures,
    prdContent,
    messages,
    model: modelConfig,
    contextService,
  } = options;

  // Build system prompt with three-layer context
  const systemPrompt = buildSystemPrompt({
    projectName,
    featureIndex,
    relatedFeatures,
    prdContent,
  });

  // Create tools
  const tools = createTools(contextService, projectId);

  // Resolve model — use getModel for known providers, construct Model for custom baseUrl
  let model: AnyModel;
  if (modelConfig.baseUrl) {
    model = {
      id: `${modelConfig.provider}/${modelConfig.modelId}`,
      name: modelConfig.modelId,
      api: "openai-completions" as Api,
      provider: modelConfig.provider,
      baseUrl: modelConfig.baseUrl,
      reasoning: false,
      input: ["text"] as ("text" | "image")[],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 128000,
      maxTokens: 4096,
      headers: modelConfig.providerConfig?.headers as Record<string, string> | undefined,
    };
  } else {
    model = getModelDynamic(modelConfig.provider, modelConfig.modelId);
  }

  // Convert existing conversation messages to Pi format
  const piMessages = toPiMessages(messages);

  const agent = new Agent({
    initialState: {
      systemPrompt,
      model,
      thinkingLevel: "off",
      tools,
      messages: piMessages,
    },
    transformContext,
    getApiKey: async () => modelConfig.apiKey,
  });

  return agent;
}
