import "dotenv/config";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Fastify from "fastify";
import fastifySSE from "@fastify/sse";
import { PostgresStorageService } from "@openepis/storage-pg";
import { resolveDataDir, McpClientManager, parseMcpConfig } from "@openepis/core";
import { Container, TOKENS } from "./container.js";
import { initDataDir } from "./datadir-init.js";
import { errorHandler } from "./errors.js";
import { projectRoutes } from "./routes/projects.js";
import { repositoryRoutes } from "./routes/repositories.js";
import { featureRoutes } from "./routes/features.js";
import { taskRoutes } from "./routes/tasks.js";
import { contextRoutes } from "./routes/context.js";
import { conversationRoutes } from "./routes/conversations.js";
import { llmConfigRoutes } from "./routes/llm-configs.js";
import { currentUserPlugin } from "./plugins/current-user.js";
import "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const container = new Container();
container.register(TOKENS.StorageService, () => new PostgresStorageService());

const app = Fastify({ logger: true });

app.setErrorHandler(errorHandler);
app.register(fastifySSE);

const storage = container.resolve(TOKENS.StorageService);
app.register(currentUserPlugin, { storage });

app.get("/api/health", async () => {
  return { status: "ok" };
});

app.register(projectRoutes, { container });
app.register(repositoryRoutes, { container });
app.register(featureRoutes, { container });
app.register(taskRoutes, { container });
app.register(contextRoutes, { container });
app.register(conversationRoutes, { container });
app.register(llmConfigRoutes, { container });

const start = async () => {
  try {
    // Initialize datadir
    const datadirPath = resolveDataDir();
    const defaultsPath = join(__dirname, "..", "defaults");
    await initDataDir(datadirPath, defaultsPath);
    container.register(TOKENS.DataDir, () => datadirPath);
    app.log.info({ datadirPath }, "Datadir initialized");

    // Initialize MCP client manager
    const mcpManager = new McpClientManager();
    const mcpConfig = await parseMcpConfig(datadirPath);
    if (mcpConfig) {
      await mcpManager.init(mcpConfig);
      app.log.info({ servers: mcpManager.getServerNames() }, "MCP servers initialized");
    }
    container.register(TOKENS.McpManager, () => mcpManager);

    const port = parseInt(process.env.PORT ?? "3001", 10);
    await app.listen({ port, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

const shutdown = async () => {
  await container.dispose();
  await app.close();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

start();
