import { pgTable, uuid, varchar, timestamp, unique, index } from "drizzle-orm/pg-core";
import { projects } from "./projects.js";
import { users } from "./users.js";

export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    project_id: uuid("project_id")
      .notNull()
      .references(() => projects.id),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id),
    role: varchar("role", { length: 20 }).notNull().$type<"pm" | "dev" | "viewer">(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("uq_project_members_project_user").on(t.project_id, t.user_id),
    index("idx_project_members_user").on(t.user_id),
    index("idx_project_members_project").on(t.project_id),
  ],
);
