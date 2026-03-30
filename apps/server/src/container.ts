import type { IStorageService } from "@openepis/storage";
import type { ILlmService } from "@openepis/llm";

const StorageService: unique symbol = Symbol.for("IStorageService");
const LlmService: unique symbol = Symbol.for("ILlmService");

export const TOKENS = {
  StorageService,
  LlmService,
} as const;

type TokenMap = {
  [StorageService]: IStorageService;
  [LlmService]: ILlmService;
};

export class Container {
  private instances = new Map<symbol, unknown>();
  private factories = new Map<symbol, () => unknown>();

  register<K extends keyof TokenMap>(token: K, factory: () => TokenMap[K]): void {
    this.factories.set(token, factory);
  }

  resolve<K extends keyof TokenMap>(token: K): TokenMap[K] {
    if (this.instances.has(token)) {
      return this.instances.get(token) as TokenMap[K];
    }
    const factory = this.factories.get(token);
    if (!factory) throw new Error(`No registration for token: ${String(token)}`);
    const instance = factory() as TokenMap[K];
    this.instances.set(token, instance);
    return instance;
  }

  async dispose(): Promise<void> {
    const storage = this.instances.get(TOKENS.StorageService) as IStorageService | undefined;
    if (storage) await storage.disconnect();
    this.instances.clear();
    this.factories.clear();
  }
}
