import { eq, and } from "drizzle-orm";
import type { LlmConfig } from "@openepis/types";
import type { ILlmConfigStorage, CreateInput, UpdateInput } from "@openepis/storage";
import { llmConfigs } from "../schema/index.js";
import type { Database } from "../connection.js";
import type { CryptoService } from "../crypto-service.js";
import { mapRow } from "../map-row.js";

export class PostgresLlmConfigStorage implements ILlmConfigStorage {
  constructor(
    private db: Database,
    private crypto: CryptoService,
  ) {}

  async findById(id: string): Promise<LlmConfig | null> {
    const rows = await this.db.select().from(llmConfigs).where(eq(llmConfigs.id, id));
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async findByScope(scope: "platform" | "project", scopeId?: string): Promise<LlmConfig[]> {
    const conditions = [eq(llmConfigs.scope, scope)];
    if (scopeId) {
      conditions.push(eq(llmConfigs.scope_id, scopeId));
    }
    const rows = await this.db
      .select()
      .from(llmConfigs)
      .where(and(...conditions));
    return rows.map((r) => this.toEntity(r));
  }

  async create(data: CreateInput<LlmConfig>): Promise<LlmConfig> {
    const { api_key, provider_config, ...rest } = data;
    const rows = await this.db
      .insert(llmConfigs)
      .values({
        ...rest,
        api_key_encrypted: api_key ? this.crypto.encrypt(api_key) : null,
        provider_config: provider_config ?? null,
      })
      .returning();
    return this.toEntity(rows[0]);
  }

  async update(id: string, data: UpdateInput<LlmConfig>): Promise<LlmConfig> {
    const { api_key, provider_config, ...rest } = data;
    const dbData: Record<string, unknown> = { ...rest };
    if (api_key !== undefined) {
      dbData.api_key_encrypted = api_key ? this.crypto.encrypt(api_key) : null;
    }
    if (provider_config !== undefined) {
      dbData.provider_config = provider_config;
    }
    const rows = await this.db
      .update(llmConfigs)
      .set(dbData)
      .where(eq(llmConfigs.id, id))
      .returning();
    return this.toEntity(rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(llmConfigs).where(eq(llmConfigs.id, id));
  }

  private toEntity(row: Record<string, unknown>): LlmConfig {
    const { api_key_encrypted, provider_config, ...rest } = row;
    const apiKey =
      typeof api_key_encrypted === "string" ? this.crypto.decrypt(api_key_encrypted) : null;
    return mapRow<LlmConfig>({
      ...rest,
      api_key: apiKey,
      provider_config: provider_config ?? null,
    });
  }
}
