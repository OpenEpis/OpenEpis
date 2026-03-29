import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import type { BddStep } from "@openepis/types";
import { features } from "./features.js";

export const scenarios = pgTable(
  "scenarios",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    feature_id: uuid("feature_id")
      .notNull()
      .references(() => features.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 500 }).notNull(),
    steps: jsonb("steps").notNull().$type<BddStep[]>(),
    tags: text("tags").array().notNull().default([]),
    sort_order: integer("sort_order").notNull().default(0),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("idx_scenarios_feature").on(t.feature_id)],
);
