import { defineCommand } from "citty";
import { getClient } from "../client.js";

export const featuresCommand = defineCommand({
  meta: {
    name: "features",
    description: "List all features in the project",
  },
  async run() {
    const { client, projectId } = getClient();
    const res = await client.features.list(projectId);

    if (res.features.length === 0) {
      console.log("No features found.");
      return;
    }

    const header = ["Title", "Status", "Scenarios", "Tags"].map((h) =>
      h.padEnd(h === "Title" ? 40 : 15),
    );
    console.log(header.join(""));
    console.log("-".repeat(85));

    for (const f of res.features) {
      const row = [
        f.title.slice(0, 38).padEnd(40),
        f.status.padEnd(15),
        String(f.scenario_count).padEnd(15),
        f.tags.join(", "),
      ];
      console.log(row.join(""));
    }
  },
});
