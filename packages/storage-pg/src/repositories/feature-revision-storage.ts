import { eq, desc } from "drizzle-orm";
import type { FeatureRevision } from "@openepis/types";
import type { IFeatureRevisionStorage, CreateInput } from "@openepis/storage";
import { featureRevisions } from "../schema/index.js";
import type { Database } from "../connection.js";
import { mapRow, mapRows } from "../map-row.js";

export class PostgresFeatureRevisionStorage implements IFeatureRevisionStorage {
  constructor(private db: Database) {}

  async findById(id: string): Promise<FeatureRevision | null> {
    const rows = await this.db.select().from(featureRevisions).where(eq(featureRevisions.id, id));
    return rows[0] ? mapRow<FeatureRevision>(rows[0]) : null;
  }

  async findByFeature(featureId: string): Promise<FeatureRevision[]> {
    const rows = await this.db
      .select()
      .from(featureRevisions)
      .where(eq(featureRevisions.feature_id, featureId))
      .orderBy(desc(featureRevisions.version));
    return mapRows<FeatureRevision>(rows);
  }

  async create(data: CreateInput<FeatureRevision>): Promise<FeatureRevision> {
    const rows = await this.db.insert(featureRevisions).values(data).returning();
    return mapRow<FeatureRevision>(rows[0]);
  }
}
