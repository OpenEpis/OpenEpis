import { eq, and } from "drizzle-orm";
import type { LlmConfig } from "@openepis/types";
import type { ILlmConfigStorage, CreateInput, UpdateInput } from "@openepis/storage";
import { llmConfigs } from "../schema/index.js";
import type { Database } from "../connection.js";
import { mapRow } from "../map-row.js";

function toEntity(row: Record<string, unknown>): LlmConfig {
  const { api_key_encrypted, ...rest } = row;
  return mapRow<LlmConfig>({ ...rest, api_key: api_key_encrypted });
}

export class PostgresLlmConfigStorage implements ILlmConfigStorage {
  constructor(private db: Database) {}

  async findById(id: string): Promise<LlmConfig | null> {
    const rows = await this.db.select().from(llmConfigs).where(eq(llmConfigs.id, id));
    return rows[0] ? toEntity(rows[0]) : null;
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
    return rows.map(toEntity);
  }

  async create(data: CreateInput<LlmConfig>): Promise<LlmConfig> {
    const { api_key, ...rest } = data;
    const rows = await this.db
      .insert(llmConfigs)
      .values({ ...rest, api_key_encrypted: api_key })
      .returning();
    return toEntity(rows[0]);
  }

  async update(id: string, data: UpdateInput<LlmConfig>): Promise<LlmConfig> {
    const { api_key, ...rest } = data;
    const dbData = api_key !== undefined ? { ...rest, api_key_encrypted: api_key } : rest;
    const rows = await this.db
      .update(llmConfigs)
      .set(dbData)
      .where(eq(llmConfigs.id, id))
      .returning();
    return toEntity(rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(llmConfigs).where(eq(llmConfigs.id, id));
  }
}
