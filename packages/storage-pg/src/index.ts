export { PostgresStorageService } from "./postgres-storage-service.js";
export { registerPostgresStorage } from "./container.js";
export { createConnection } from "./connection.js";
export type { Database } from "./connection.js";

// Re-export schema for migration tooling and direct queries
export * as schema from "./schema/index.js";
