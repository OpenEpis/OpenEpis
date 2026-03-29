import { eq } from "drizzle-orm";
import type { Project } from "@openepis/types";
import type { IProjectStorage, CreateInput, UpdateInput } from "@openepis/storage";
import { projects, projectMembers } from "../schema/index.js";
import type { Database } from "../connection.js";
import { mapRow } from "../map-row.js";

export class PostgresProjectStorage implements IProjectStorage {
  constructor(private db: Database) {}

  async findById(id: string): Promise<Project | null> {
    const rows = await this.db.select().from(projects).where(eq(projects.id, id));
    return rows[0] ? mapRow<Project>(rows[0]) : null;
  }

  async findByUser(userId: string): Promise<Project[]> {
    const rows = await this.db
      .select({ project: projects })
      .from(projects)
      .innerJoin(projectMembers, eq(projects.id, projectMembers.project_id))
      .where(eq(projectMembers.user_id, userId));
    return rows.map((r) => mapRow<Project>(r.project));
  }

  async create(data: CreateInput<Project>): Promise<Project> {
    const rows = await this.db.insert(projects).values(data).returning();
    return mapRow<Project>(rows[0]);
  }

  async update(id: string, data: UpdateInput<Project>): Promise<Project> {
    const rows = await this.db.update(projects).set(data).where(eq(projects.id, id)).returning();
    return mapRow<Project>(rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(projects).where(eq(projects.id, id));
  }
}
