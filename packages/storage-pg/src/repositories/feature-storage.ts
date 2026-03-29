import { eq, asc } from "drizzle-orm";
import type { Feature } from "@openepis/types";
import type { IFeatureStorage, CreateInput, UpdateInput } from "@openepis/storage";
import { features } from "../schema/index.js";
import type { Database } from "../connection.js";
import { mapRow, mapRows } from "../map-row.js";

export class PostgresFeatureStorage implements IFeatureStorage {
  constructor(private db: Database) {}

  async findById(id: string): Promise<Feature | null> {
    const rows = await this.db.select().from(features).where(eq(features.id, id));
    return rows[0] ? mapRow<Feature>(rows[0]) : null;
  }

  async findByProject(projectId: string): Promise<Feature[]> {
    const rows = await this.db
      .select()
      .from(features)
      .where(eq(features.project_id, projectId))
      .orderBy(asc(features.sort_order));
    return mapRows<Feature>(rows);
  }

  async create(data: CreateInput<Feature>): Promise<Feature> {
    const rows = await this.db.insert(features).values(data).returning();
    return mapRow<Feature>(rows[0]);
  }

  async update(id: string, data: UpdateInput<Feature>): Promise<Feature> {
    const rows = await this.db.update(features).set(data).where(eq(features.id, id)).returning();
    return mapRow<Feature>(rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(features).where(eq(features.id, id));
  }
}
