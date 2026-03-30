import type { AgentTool } from "@mariozechner/pi-agent-core";
import type { Static } from "@sinclair/typebox";
import type { IBddContextService } from "../types.js";
import { GetFeatureDetailParams } from "./schemas.js";

export function createGetFeatureDetailTool(
  contextService: IBddContextService,
): AgentTool<typeof GetFeatureDetailParams> {
  return {
    name: "get_feature_detail",
    label: "Get Feature Detail",
    description:
      "Retrieve the full detail of a BDD Feature including all its Scenarios and steps. Use this when you need more context about a specific Feature.",
    parameters: GetFeatureDetailParams,
    execute: async (_toolCallId: string, params: Static<typeof GetFeatureDetailParams>) => {
      const detail = await contextService.getFeatureDetail(params.featureId);
      if (!detail) {
        throw new Error(`Feature not found: ${params.featureId}`);
      }
      return {
        content: [{ type: "text" as const, text: JSON.stringify(detail, null, 2) }],
        details: {
          featureId: detail.id,
          title: detail.title,
          scenarioCount: detail.scenarios.length,
        },
      };
    },
  };
}
