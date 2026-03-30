---
name: openepis-features
description: List all BDD features in the current OpenEpis project. Use when the developer wants to see available features, their statuses, scenario counts, and tags.
disable-model-invocation: true
---

List all BDD features in the current OpenEpis project.

Run the CLI:

```bash
npx @openepis/cli features
```

Present the output to the user. The output is a table with columns: Title, Status, Scenarios, Tags.

If the command fails:

- If `.openepis.json` is missing, instruct the user to create it in the repo root with `apiUrl` and `projectId`
- If the server is unreachable, suggest checking that the OpenEpis API server is running at the configured URL
