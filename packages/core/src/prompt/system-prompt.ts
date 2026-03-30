import type { FeatureSummary, FeatureDetail } from "../types.js";
import {
  ROLE_TEMPLATE,
  BDD_FORMAT_INSTRUCTIONS,
  TOOL_USAGE_GUIDANCE,
  CONVERSATION_GUIDANCE,
} from "./templates.js";

export interface SystemPromptOptions {
  projectName: string;
  featureIndex: FeatureSummary[];
  relatedFeatures: FeatureDetail[];
  prdContent?: string;
}

export function buildSystemPrompt(options: SystemPromptOptions): string {
  const { projectName, featureIndex, relatedFeatures, prdContent } = options;

  const sections: string[] = [];

  // Role definition
  sections.push(ROLE_TEMPLATE.replace("{projectName}", projectName));

  // Layer 1 — Feature Index (always loaded)
  if (featureIndex.length > 0) {
    const indexLines = featureIndex.map(
      (f) => `- **${f.title}** (${f.scenarioCount} scenarios): ${f.description}`,
    );
    sections.push(`## Existing BDD Index\n\n${indexLines.join("\n")}`);
  } else {
    sections.push("## Existing BDD Index\n\nNo existing Features in this project yet.");
  }

  // Layer 2 — Related Features (preloaded details)
  if (relatedFeatures.length > 0) {
    const detailBlocks = relatedFeatures.map((f) => {
      const scenarioLines = f.scenarios.map((s) => {
        const stepLines = s.steps
          .map(
            (step) =>
              `      ${step.type.charAt(0).toUpperCase() + step.type.slice(1)} ${step.text}`,
          )
          .join("\n");
        const tags = s.tags.length > 0 ? ` [${s.tags.join(", ")}]` : "";
        return `    Scenario: ${s.title}${tags}\n${stepLines}`;
      });
      const tags = f.tags.length > 0 ? ` [${f.tags.join(", ")}]` : "";
      return `### ${f.title}${tags}\n\nID: ${f.id}\n${f.description}\n\n${scenarioLines.join("\n\n")}`;
    });
    sections.push(`## Related BDD Details\n\n${detailBlocks.join("\n\n---\n\n")}`);
  }

  // PRD content (if attached)
  if (prdContent) {
    sections.push(`## PRD Context\n\n${prdContent}`);
  }

  // Instructions
  sections.push(BDD_FORMAT_INSTRUCTIONS);
  sections.push(TOOL_USAGE_GUIDANCE);
  sections.push(CONVERSATION_GUIDANCE);

  return sections.join("\n\n");
}
