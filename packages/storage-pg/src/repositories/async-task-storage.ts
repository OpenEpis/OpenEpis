import { eq } from "drizzle-orm";
import type { AsyncTask } from "@openepis/types";
import type { IAsyncTaskStorage, CreateInput, UpdateInput } from "@openepis/storage";
import { asyncTasks } from "../schema/index.js";
import type { Database } from "../connection.js";
import { mapRow, mapRows } from "../map-row.js";

export class PostgresAsyncTaskStorage implements IAsyncTaskStorage {
  constructor(private db: Database) {}

  async findById(id: string): Promise<AsyncTask | null> {
    const rows = await this.db.select().from(asyncTasks).where(eq(asyncTasks.id, id));
    return rows[0] ? mapRow<AsyncTask>(rows[0]) : null;
  }

  async findByProject(projectId: string): Promise<AsyncTask[]> {
    const rows = await this.db
      .select()
      .from(asyncTasks)
      .where(eq(asyncTasks.project_id, projectId));
    return mapRows<AsyncTask>(rows);
  }

  async create(data: CreateInput<AsyncTask>): Promise<AsyncTask> {
    const rows = await this.db.insert(asyncTasks).values(data).returning();
    return mapRow<AsyncTask>(rows[0]);
  }

  async update(id: string, data: UpdateInput<AsyncTask>): Promise<AsyncTask> {
    const rows = await this.db
      .update(asyncTasks)
      .set(data)
      .where(eq(asyncTasks.id, id))
      .returning();
    return mapRow<AsyncTask>(rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(asyncTasks).where(eq(asyncTasks.id, id));
  }
}
