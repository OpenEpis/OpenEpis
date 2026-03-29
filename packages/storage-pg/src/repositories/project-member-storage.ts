import { eq } from "drizzle-orm";
import type { ProjectMember } from "@openepis/types";
import type { IProjectMemberStorage, CreateInput, UpdateInput } from "@openepis/storage";
import { projectMembers } from "../schema/index.js";
import type { Database } from "../connection.js";
import { mapRow, mapRows } from "../map-row.js";

export class PostgresProjectMemberStorage implements IProjectMemberStorage {
  constructor(private db: Database) {}

  async findById(id: string): Promise<ProjectMember | null> {
    const rows = await this.db.select().from(projectMembers).where(eq(projectMembers.id, id));
    return rows[0] ? mapRow<ProjectMember>(rows[0]) : null;
  }

  async findByProject(projectId: string): Promise<ProjectMember[]> {
    const rows = await this.db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.project_id, projectId));
    return mapRows<ProjectMember>(rows);
  }

  async create(data: CreateInput<ProjectMember>): Promise<ProjectMember> {
    const rows = await this.db.insert(projectMembers).values(data).returning();
    return mapRow<ProjectMember>(rows[0]);
  }

  async update(id: string, data: UpdateInput<ProjectMember>): Promise<ProjectMember> {
    const rows = await this.db
      .update(projectMembers)
      .set(data)
      .where(eq(projectMembers.id, id))
      .returning();
    return mapRow<ProjectMember>(rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(projectMembers).where(eq(projectMembers.id, id));
  }
}
