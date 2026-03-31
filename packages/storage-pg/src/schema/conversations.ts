import { pgTable, uuid, varchar, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import type { ConversationMessage, GeneratedChanges } from "@openepis/types";
import { projects } from "./projects.js";

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    project_id: uuid("project_id")
      .notNull()
      .references(() => projects.id),
    messages: jsonb("messages").notNull().$type<ConversationMessage[]>(),
    status: varchar("status", { length: 20 })
      .notNull()
      .default("active")
      .$type<"active" | "completed" | "cancelled">(),
    pending_changes: jsonb("pending_changes").$type<GeneratedChanges | null>(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("idx_conversations_project").on(t.project_id)],
);
