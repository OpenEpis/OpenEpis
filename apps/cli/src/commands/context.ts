import { defineCommand } from "citty";
import { getClient } from "../client.js";

export const contextCommand = defineCommand({
  meta: {
    name: "context",
    description: "Find BDD related to a source file",
  },
  args: {
    file: {
      type: "positional",
      description: "Source file path",
      required: true,
    },
    repository: {
      type: "string",
      description: "Repository name",
      alias: "r",
    },
  },
  async run({ args }) {
    const { client, projectId } = getClient();

    const res = await client.context.query(projectId, {
      file_path: args.file,
      repository: args.repository ?? "",
    });

    if (res.related_features.length === 0) {
      console.log(`No BDD features found related to "${args.file}".`);
      return;
    }

    for (const feature of res.related_features) {
      const badge =
        feature.relevance === "high"
          ? "[HIGH]"
          : feature.relevance === "medium"
            ? "[MED] "
            : "[LOW] ";
      console.log(`${badge} ${feature.title}`);
      for (const scenario of feature.related_scenarios) {
        console.log(`       - ${scenario}`);
      }
      console.log("");
    }
  },
});
