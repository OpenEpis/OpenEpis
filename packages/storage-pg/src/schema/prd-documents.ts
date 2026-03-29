import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { projects } from "./projects.js";
import { users } from "./users.js";

export const prdDocuments = pgTable(
  "prd_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    project_id: uuid("project_id")
      .notNull()
      .references(() => projects.id),
    title: varchar("title", { length: 500 }).notNull(),
    content: text("content").notNull(),
    status: varchar("status", { length: 20 })
      .notNull()
      .default("draft")
      .$type<"draft" | "in_review" | "completed">(),
    created_by: uuid("created_by")
      .notNull()
      .references(() => users.id),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("idx_prd_project").on(t.project_id)],
);
