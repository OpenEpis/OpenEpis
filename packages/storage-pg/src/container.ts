import { container } from "tsyringe";
import { STORAGE_SERVICE } from "@openepis/storage";
import { PostgresStorageService } from "./postgres-storage-service.js";

export function registerPostgresStorage() {
  container.register(STORAGE_SERVICE, { useClass: PostgresStorageService });
}
