import type { AgentTool } from "@mariozechner/pi-agent-core";
import type { Static } from "@sinclair/typebox";
import type { IBddContextService } from "../types.js";
import { SearchFeaturesParams } from "./schemas.js";

export function createSearchFeaturesTool(
  contextService: IBddContextService,
  projectId: string,
): AgentTool<typeof SearchFeaturesParams> {
  return {
    name: "search_features",
    label: "Search Features",
    description:
      "Search existing BDD Features by keyword. Returns matching Features with their titles, descriptions, tags, and scenario counts.",
    parameters: SearchFeaturesParams,
    execute: async (_toolCallId: string, params: Static<typeof SearchFeaturesParams>) => {
      const results = await contextService.searchFeatures(projectId, params.query);
      if (results.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No Features found matching "${params.query}".`,
            },
          ],
          details: { query: params.query, count: 0 },
        };
      }
      return {
        content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }],
        details: { query: params.query, count: results.length },
      };
    },
  };
}
