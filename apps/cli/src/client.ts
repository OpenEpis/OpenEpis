import { OpenEpisClient } from "@openepis/sdk";
import { loadConfig } from "./config.js";

let cachedClient: { client: OpenEpisClient; projectId: string } | null = null;

export function getClient(): { client: OpenEpisClient; projectId: string } {
  if (!cachedClient) {
    const config = loadConfig();
    cachedClient = {
      client: new OpenEpisClient({ baseUrl: config.apiUrl }),
      projectId: config.projectId,
    };
  }
  return cachedClient;
}
