import { eq } from "drizzle-orm";
import type { PrdDocument } from "@openepis/types";
import type { IPrdDocumentStorage, CreateInput, UpdateInput } from "@openepis/storage";
import { prdDocuments } from "../schema/index.js";
import type { Database } from "../connection.js";
import { mapRow, mapRows } from "../map-row.js";

export class PostgresPrdDocumentStorage implements IPrdDocumentStorage {
  constructor(private db: Database) {}

  async findById(id: string): Promise<PrdDocument | null> {
    const rows = await this.db.select().from(prdDocuments).where(eq(prdDocuments.id, id));
    return rows[0] ? mapRow<PrdDocument>(rows[0]) : null;
  }

  async findByProject(projectId: string): Promise<PrdDocument[]> {
    const rows = await this.db
      .select()
      .from(prdDocuments)
      .where(eq(prdDocuments.project_id, projectId));
    return mapRows<PrdDocument>(rows);
  }

  async create(data: CreateInput<PrdDocument>): Promise<PrdDocument> {
    const rows = await this.db.insert(prdDocuments).values(data).returning();
    return mapRow<PrdDocument>(rows[0]);
  }

  async update(id: string, data: UpdateInput<PrdDocument>): Promise<PrdDocument> {
    const rows = await this.db
      .update(prdDocuments)
      .set(data)
      .where(eq(prdDocuments.id, id))
      .returning();
    return mapRow<PrdDocument>(rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(prdDocuments).where(eq(prdDocuments.id, id));
  }
}
