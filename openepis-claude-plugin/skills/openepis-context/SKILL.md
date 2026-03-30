---
name: openepis-context
description: Find BDD features related to a source file, grouped by relevance (HIGH/MED/LOW). Use when the developer wants to understand which BDD requirements are relevant to a file they are working on.
argument-hint: <file-path> [-r repository]
disable-model-invocation: true
---

Find BDD features related to a source file.

If `$ARGUMENTS` is empty, ask the user which file they want to find context for.

Run the CLI:

```bash
npx @openepis/cli context $ARGUMENTS
```

The user may pass `-r <repository>` as part of the arguments to scope the query to a specific repository.

Present the output to the user. The output shows related BDD features grouped by relevance level:

- `[HIGH]` — strongly related features
- `[MED]` — moderately related features
- `[LOW]` — loosely related features

Each feature lists its related scenario names.

If no related BDD features are found, inform the user that no features are associated with that file.

If the command fails:

- If `.openepis.json` is missing, instruct the user to create it in the repo root with `apiUrl` and `projectId`
- If the server is unreachable, suggest checking that the OpenEpis API server is running
