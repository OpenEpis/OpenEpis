import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

export function createConnection() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Create a .env file with DATABASE_URL=postgres://user:password@localhost:5432/openepis",
    );
  }

  const client = postgres(url);
  const db = drizzle(client, { schema });

  return { db, client };
}

export type Database = ReturnType<typeof createConnection>["db"];
