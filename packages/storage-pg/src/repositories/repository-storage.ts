import { eq } from "drizzle-orm";
import type { Repository } from "@openepis/types";
import type { IRepositoryStorage, CreateInput, UpdateInput } from "@openepis/storage";
import { repositories } from "../schema/index.js";
import type { Database } from "../connection.js";
import { mapRow, mapRows } from "../map-row.js";

function toDateInput(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data };
  if (typeof result.last_synced_at === "string") {
    result.last_synced_at = new Date(result.last_synced_at);
  }
  return result;
}

export class PostgresRepositoryStorage implements IRepositoryStorage {
  constructor(private db: Database) {}

  async findById(id: string): Promise<Repository | null> {
    const rows = await this.db.select().from(repositories).where(eq(repositories.id, id));
    return rows[0] ? mapRow<Repository>(rows[0]) : null;
  }

  async findByProject(projectId: string): Promise<Repository[]> {
    const rows = await this.db
      .select()
      .from(repositories)
      .where(eq(repositories.project_id, projectId));
    return mapRows<Repository>(rows);
  }

  async create(data: CreateInput<Repository>): Promise<Repository> {
    const rows = await this.db
      .insert(repositories)
      .values(toDateInput(data) as typeof repositories.$inferInsert)
      .returning();
    return mapRow<Repository>(rows[0]);
  }

  async update(id: string, data: UpdateInput<Repository>): Promise<Repository> {
    const rows = await this.db
      .update(repositories)
      .set(toDateInput(data) as Partial<typeof repositories.$inferInsert>)
      .where(eq(repositories.id, id))
      .returning();
    return mapRow<Repository>(rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(repositories).where(eq(repositories.id, id));
  }
}
