import type { AgentTool } from "@mariozechner/pi-agent-core";
import type { IBddContextService } from "../types.js";
import { createGetFeatureDetailTool } from "./get-feature-detail.js";
import { createSearchFeaturesTool } from "./search-features.js";
import { createUpdateBddTool } from "./update-bdd.js";

export function createTools(
  contextService: IBddContextService,
  projectId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): AgentTool<any>[] {
  return [
    createGetFeatureDetailTool(contextService),
    createSearchFeaturesTool(contextService, projectId),
    createUpdateBddTool(),
  ];
}
