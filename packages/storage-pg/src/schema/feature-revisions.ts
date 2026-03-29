import { pgTable, uuid, integer, jsonb, text, timestamp, index } from "drizzle-orm/pg-core";
import type { FeatureRevision } from "@openepis/types";
import { features } from "./features.js";
import { users } from "./users.js";

export const featureRevisions = pgTable(
  "feature_revisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    feature_id: uuid("feature_id")
      .notNull()
      .references(() => features.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    snapshot: jsonb("snapshot").notNull().$type<FeatureRevision["snapshot"]>(),
    change_summary: text("change_summary").notNull(),
    changed_by: uuid("changed_by")
      .notNull()
      .references(() => users.id),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_feature_revisions_feature").on(t.feature_id, t.version)],
);
