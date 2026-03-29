import { pgTable, uuid, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const llmConfigs = pgTable("llm_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  scope: varchar("scope", { length: 20 }).notNull().$type<"platform" | "project">(),
  scope_id: uuid("scope_id"),
  provider: varchar("provider", { length: 50 }).notNull().$type<"claude" | "openai" | "ollama">(),
  model: varchar("model", { length: 100 }).notNull(),
  api_key_encrypted: text("api_key_encrypted"),
  base_url: text("base_url"),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
