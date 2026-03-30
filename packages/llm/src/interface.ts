import type { z } from "zod";

export interface GenerateTextOptions {
  prompt: string;
  system?: string;
  configId?: string;
  projectId?: string;
}

export interface GenerateObjectOptions<T extends z.ZodType> extends GenerateTextOptions {
  schema: T;
}

export interface GenerateTextResult {
  text: string;
}

export interface GenerateObjectResult<T extends z.ZodType> {
  object: z.infer<T>;
}

export interface ILlmService {
  generateText(options: GenerateTextOptions): Promise<GenerateTextResult>;
  generateObject<T extends z.ZodType>(
    options: GenerateObjectOptions<T>,
  ): Promise<GenerateObjectResult<T>>;
}
