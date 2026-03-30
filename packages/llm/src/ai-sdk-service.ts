import { generateText, Output } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { z } from "zod";
import type { LlmConfig } from "@openepis/types";
import type { ILlmConfigStorage } from "@openepis/storage";
import type {
  ILlmService,
  GenerateTextOptions,
  GenerateObjectOptions,
  GenerateTextResult,
  GenerateObjectResult,
} from "./interface.js";

export class AiSdkLlmService implements ILlmService {
  constructor(private llmConfigs: ILlmConfigStorage) {}

  async generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
    const model = await this.resolveModel(options);
    const result = await generateText({
      model,
      system: options.system,
      prompt: options.prompt,
    });
    return { text: result.text };
  }

  async generateObject<T extends z.ZodType>(
    options: GenerateObjectOptions<T>,
  ): Promise<GenerateObjectResult<T>> {
    const model = await this.resolveModel(options);
    const result = await generateText({
      model,
      system: options.system,
      prompt: options.prompt,
      output: Output.object({ schema: options.schema }),
    });
    return { object: result.output as z.infer<T> };
  }

  private async resolveModel(options: GenerateTextOptions) {
    const config = await this.resolveConfig(options);
    return this.createModel(config);
  }

  private async resolveConfig(options: GenerateTextOptions): Promise<LlmConfig> {
    if (options.configId) {
      const config = await this.llmConfigs.findById(options.configId);
      if (!config) {
        throw new Error(`LLM config not found: ${options.configId}`);
      }
      return config;
    }

    if (options.projectId) {
      const configs = await this.llmConfigs.findByScope("project", options.projectId);
      const active = configs.find((c) => c.is_active);
      if (active) return active;
    }

    const platformConfigs = await this.llmConfigs.findByScope("platform");
    const active = platformConfigs.find((c) => c.is_active);
    if (active) return active;

    throw new Error(
      "No LLM configured. Create a platform-level or project-level LLM configuration.",
    );
  }

  private createModel(config: LlmConfig) {
    const baseURL = config.base_url ?? undefined;
    const apiKey = config.api_key ?? undefined;

    switch (config.provider) {
      case "claude": {
        const anthropic = createAnthropic({ apiKey, baseURL });
        return anthropic(config.model);
      }
      case "openai": {
        const openai = createOpenAI({ apiKey, baseURL });
        return openai(config.model);
      }
      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
  }
}
