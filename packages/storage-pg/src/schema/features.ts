import { pgTable, uuid, varchar, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { projects } from "./projects.js";
import { users } from "./users.js";

export const features = pgTable(
  "features",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    project_id: uuid("project_id")
      .notNull()
      .references(() => projects.id),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description").notNull(),
    status: varchar("status", { length: 20 })
      .notNull()
      .default("draft")
      .$type<"draft" | "active" | "deprecated">(),
    version: integer("version").notNull().default(1),
    tags: text("tags").array().notNull().default([]),
    sort_order: integer("sort_order").notNull().default(0),
    created_by: uuid("created_by")
      .notNull()
      .references(() => users.id),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("idx_features_project").on(t.project_id)],
);
