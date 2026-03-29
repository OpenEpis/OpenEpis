import { defineCommand } from "citty";
import { getClient } from "../client.js";

export const bddCommand = defineCommand({
  meta: {
    name: "bdd",
    description: "View full BDD for a feature",
  },
  args: {
    feature: {
      type: "positional",
      description: "Feature name or ID",
      required: true,
    },
  },
  async run({ args }) {
    const { client, projectId } = getClient();
    const featureQuery = args.feature;

    // Try as ID first, fall back to name search
    let featureId: string | undefined;
    const listRes = await client.features.list(projectId, {
      search: featureQuery,
    });
    const match = listRes.features.find((f) => f.id === featureQuery || f.title === featureQuery);
    if (match) {
      featureId = match.id;
    } else if (listRes.features.length === 1) {
      featureId = listRes.features[0].id;
    } else if (listRes.features.length > 1) {
      console.log(`Multiple features match "${featureQuery}":`);
      for (const f of listRes.features) {
        console.log(`  - ${f.title} (${f.id})`);
      }
      return;
    } else {
      console.error(`No feature found matching "${featureQuery}".`);
      return;
    }

    const detail = await client.features.get(featureId);

    console.log(`Feature: ${detail.title}`);
    console.log(`Status: ${detail.status} | Version: ${detail.version}`);
    if (detail.tags.length > 0) {
      console.log(`Tags: ${detail.tags.join(", ")}`);
    }
    if (detail.description) {
      console.log(`\n${detail.description}`);
    }
    console.log("");

    for (const scenario of detail.scenarios) {
      console.log(`  Scenario: ${scenario.title}`);
      for (const step of scenario.steps) {
        const keyword = step.type.charAt(0).toUpperCase() + step.type.slice(1);
        console.log(`    ${keyword} ${step.text}`);
      }
      console.log("");
    }
  },
});
