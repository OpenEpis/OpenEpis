import { eq } from "drizzle-orm";
import type { User } from "@openepis/types";
import type { IUserStorage, CreateInput, UpdateInput } from "@openepis/storage";
import { users } from "../schema/index.js";
import type { Database } from "../connection.js";
import { mapRow } from "../map-row.js";

export class PostgresUserStorage implements IUserStorage {
  constructor(private db: Database) {}

  async findById(id: string): Promise<User | null> {
    const rows = await this.db.select().from(users).where(eq(users.id, id));
    return rows[0] ? mapRow<User>(rows[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.db.select().from(users).where(eq(users.email, email));
    return rows[0] ? mapRow<User>(rows[0]) : null;
  }

  async create(data: CreateInput<User>): Promise<User> {
    const rows = await this.db.insert(users).values(data).returning();
    return mapRow<User>(rows[0]);
  }

  async update(id: string, data: UpdateInput<User>): Promise<User> {
    const rows = await this.db.update(users).set(data).where(eq(users.id, id)).returning();
    return mapRow<User>(rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }
}
