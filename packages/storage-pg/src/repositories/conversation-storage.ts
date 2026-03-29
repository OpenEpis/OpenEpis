import { eq } from "drizzle-orm";
import type { Conversation } from "@openepis/types";
import type { IConversationStorage, CreateInput, UpdateInput } from "@openepis/storage";
import { conversations } from "../schema/index.js";
import type { Database } from "../connection.js";
import { mapRow, mapRows } from "../map-row.js";

export class PostgresConversationStorage implements IConversationStorage {
  constructor(private db: Database) {}

  async findById(id: string): Promise<Conversation | null> {
    const rows = await this.db.select().from(conversations).where(eq(conversations.id, id));
    return rows[0] ? mapRow<Conversation>(rows[0]) : null;
  }

  async findByPrd(prdId: string): Promise<Conversation[]> {
    const rows = await this.db.select().from(conversations).where(eq(conversations.prd_id, prdId));
    return mapRows<Conversation>(rows);
  }

  async create(data: CreateInput<Conversation>): Promise<Conversation> {
    const rows = await this.db.insert(conversations).values(data).returning();
    return mapRow<Conversation>(rows[0]);
  }

  async update(id: string, data: UpdateInput<Conversation>): Promise<Conversation> {
    const rows = await this.db
      .update(conversations)
      .set(data)
      .where(eq(conversations.id, id))
      .returning();
    return mapRow<Conversation>(rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(conversations).where(eq(conversations.id, id));
  }
}
