import type { AgentTool } from "@mariozechner/pi-agent-core";
import type { Static } from "@sinclair/typebox";
import { UpdateBddParams } from "./schemas.js";

export function createUpdateBddTool(): AgentTool<typeof UpdateBddParams> {
  return {
    name: "update_bdd",
    label: "Update BDD",
    description:
      "Propose BDD changes based on the conversation. Call this when you have enough information to generate or update BDD Features and Scenarios. You may call this multiple times to refine your proposal.",
    parameters: UpdateBddParams,
    execute: async (_toolCallId: string, params: Static<typeof UpdateBddParams>) => {
      const newCount = params.new_features?.length ?? 0;
      const modifiedCount = params.modified_features?.length ?? 0;

      const parts: string[] = [];
      if (newCount > 0) {
        const titles = params.new_features!.map((f) => f.title).join(", ");
        parts.push(`${newCount} new feature(s): ${titles}`);
      }
      if (modifiedCount > 0) {
        const ids = params.modified_features!.map((f) => f.feature_id).join(", ");
        parts.push(`${modifiedCount} modified feature(s): ${ids}`);
      }

      const summary =
        parts.length > 0
          ? `Recorded: ${parts.join("; ")}`
          : "No changes recorded (empty proposal).";

      return {
        content: [{ type: "text" as const, text: summary }],
        details: {
          new_features: newCount,
          modified_features: modifiedCount,
          changes: params,
        },
      };
    },
  };
}
