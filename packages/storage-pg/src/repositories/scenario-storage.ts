import { eq, asc } from "drizzle-orm";
import type { Scenario } from "@openepis/types";
import type { IScenarioStorage, CreateInput, UpdateInput } from "@openepis/storage";
import { scenarios } from "../schema/index.js";
import type { Database } from "../connection.js";
import { mapRow, mapRows } from "../map-row.js";

export class PostgresScenarioStorage implements IScenarioStorage {
  constructor(private db: Database) {}

  async findById(id: string): Promise<Scenario | null> {
    const rows = await this.db.select().from(scenarios).where(eq(scenarios.id, id));
    return rows[0] ? mapRow<Scenario>(rows[0]) : null;
  }

  async findByFeature(featureId: string): Promise<Scenario[]> {
    const rows = await this.db
      .select()
      .from(scenarios)
      .where(eq(scenarios.feature_id, featureId))
      .orderBy(asc(scenarios.sort_order));
    return mapRows<Scenario>(rows);
  }

  async create(data: CreateInput<Scenario>): Promise<Scenario> {
    const rows = await this.db.insert(scenarios).values(data).returning();
    return mapRow<Scenario>(rows[0]);
  }

  async update(id: string, data: UpdateInput<Scenario>): Promise<Scenario> {
    const rows = await this.db.update(scenarios).set(data).where(eq(scenarios.id, id)).returning();
    return mapRow<Scenario>(rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(scenarios).where(eq(scenarios.id, id));
  }
}
