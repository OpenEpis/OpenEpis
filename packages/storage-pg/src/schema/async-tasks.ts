import {
  pgTable,
  uuid,
  varchar,
  integer,
  jsonb,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { projects } from "./projects.js";
import { users } from "./users.js";

export const asyncTasks = pgTable(
  "async_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    project_id: uuid("project_id")
      .notNull()
      .references(() => projects.id),
    type: varchar("type", { length: 50 }).notNull().$type<"init_bdd" | "generate_bdd">(),
    status: varchar("status", { length: 20 })
      .notNull()
      .default("queued")
      .$type<"queued" | "running" | "completed" | "failed">(),
    progress: integer("progress").notNull().default(0),
    result: jsonb("result").$type<Record<string, unknown> | null>(),
    error: text("error"),
    created_by: uuid("created_by")
      .notNull()
      .references(() => users.id),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("idx_async_tasks_project_status").on(t.project_id, t.status)],
);
