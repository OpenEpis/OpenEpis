import { pgTable, uuid, varchar, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import type { ConversationMessage, GeneratedChanges } from "@openepis/types";
import { prdDocuments } from "./prd-documents.js";
import { projects } from "./projects.js";

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    prd_id: uuid("prd_id")
      .notNull()
      .references(() => prdDocuments.id, { onDelete: "cascade" }),
    project_id: uuid("project_id")
      .notNull()
      .references(() => projects.id),
    messages: jsonb("messages").notNull().$type<ConversationMessage[]>(),
    status: varchar("status", { length: 20 })
      .notNull()
      .default("active")
      .$type<"active" | "completed" | "cancelled">(),
    generated_changes: jsonb("generated_changes").$type<GeneratedChanges | null>(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("idx_conversations_prd").on(t.prd_id)],
);
