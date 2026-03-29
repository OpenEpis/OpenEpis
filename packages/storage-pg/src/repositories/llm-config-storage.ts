import { eq, and } from "drizzle-orm";
import type { LlmConfig } from "@openepis/types";
import type { ILlmConfigStorage, CreateInput, UpdateInput } from "@openepis/storage";
import { llmConfigs } from "../schema/index.js";
import type { Database } from "../connection.js";
import { mapRow, mapRows } from "../map-row.js";

export class PostgresLlmConfigStorage implements ILlmConfigStorage {
  constructor(private db: Database) {}

  async findById(id: string): Promise<LlmConfig | null> {
    const rows = await this.db.select().from(llmConfigs).where(eq(llmConfigs.id, id));
    return rows[0] ? mapRow<LlmConfig>(rows[0]) : null;
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
    return mapRows<LlmConfig>(rows);
  }

  async create(data: CreateInput<LlmConfig>): Promise<LlmConfig> {
    const rows = await this.db.insert(llmConfigs).values(data).returning();
    return mapRow<LlmConfig>(rows[0]);
  }

  async update(id: string, data: UpdateInput<LlmConfig>): Promise<LlmConfig> {
    const rows = await this.db
      .update(llmConfigs)
      .set(data)
      .where(eq(llmConfigs.id, id))
      .returning();
    return mapRow<LlmConfig>(rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(llmConfigs).where(eq(llmConfigs.id, id));
  }
}
