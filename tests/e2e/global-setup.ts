import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";

config({ path: ".env.test" });

export default async function globalSetup() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL not set. Create .env.test with DATABASE_URL pointing to the test database.",
    );
  }

  const client = postgres(databaseUrl);
  const db = drizzle(client);

  // Truncate all tables for a clean state.
  // Schema must be pushed beforehand via: DATABASE_URL=<test-db> pnpm db:pg:push
  const tables = await db.execute<{ tablename: string }>(
    sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
  );

  for (const { tablename } of tables) {
    if (tablename === "drizzle_migrations" || tablename.startsWith("__")) continue;
    await db.execute(sql.raw(`TRUNCATE TABLE "${tablename}" CASCADE`));
  }

  await client.end();
}
