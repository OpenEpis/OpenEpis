import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { projects } from "./projects.js";

export const repositories = pgTable("repositories", {
  id: uuid("id").primaryKey().defaultRandom(),
  project_id: uuid("project_id")
    .notNull()
    .references(() => projects.id),
  name: varchar("name", { length: 255 }).notNull(),
  git_url: text("git_url").notNull(),
  default_branch: varchar("default_branch", { length: 255 }).notNull().default("main"),
  credentials_encrypted: text("credentials_encrypted"),
  last_synced_at: timestamp("last_synced_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
