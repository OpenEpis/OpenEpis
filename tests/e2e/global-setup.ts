import { mkdir, readdir, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";
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

  // Clean up test datadir skills from previous runs
  const datadirPath = resolve(process.env.OPENEPIS_DATA_DIR || ".test-datadir");
  const skillsDir = join(datadirPath, "skills");
  await mkdir(skillsDir, { recursive: true });
  try {
    const files = await readdir(skillsDir);
    for (const f of files) {
      if (f.endsWith(".md")) await unlink(join(skillsDir, f));
    }
  } catch {
    // ok if empty
  }

  // Set up .mcp.json with echo test server for MCP integration tests.
  // The server reads this at startup, so it must be in place before dev:server starts.
  const { writeFile } = await import("node:fs/promises");
  const echoServerPath = resolve("tests/e2e/fixtures/echo-mcp-server.ts");
  const mcpConfig = {
    mcpServers: {
      "echo-test": {
        transport: "stdio",
        command: "node",
        args: ["--import", "tsx/esm", echoServerPath],
      },
    },
  };
  await writeFile(join(datadirPath, ".mcp.json"), JSON.stringify(mcpConfig, null, 2));
}
