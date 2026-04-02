import type { IStorageService } from "@openepis/storage";
import type { McpClientManager } from "@openepis/core";

const StorageService: unique symbol = Symbol.for("IStorageService");
const DataDir: unique symbol = Symbol.for("DataDir");
const McpManager: unique symbol = Symbol.for("McpClientManager");

export const TOKENS = {
  StorageService,
  DataDir,
  McpManager,
} as const;

type TokenMap = {
  [StorageService]: IStorageService;
  [DataDir]: string;
  [McpManager]: McpClientManager;
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
    const mcpManager = this.instances.get(TOKENS.McpManager) as McpClientManager | undefined;
    if (mcpManager) await mcpManager.shutdown();
    const storage = this.instances.get(TOKENS.StorageService) as IStorageService | undefined;
    if (storage) await storage.disconnect();
    this.instances.clear();
    this.factories.clear();
  }
}
