---
name: openepis-bdd
description: View full BDD detail for a specific feature including scenarios and Given/When/Then steps. Use when the developer wants to see the complete BDD specification for a feature.
argument-hint: <feature-name-or-id>
disable-model-invocation: true
---

View full BDD detail for a specific feature.

If `$ARGUMENTS` is empty, ask the user which feature they want to view.

Run the CLI:

```bash
npx @openepis/cli bdd "$ARGUMENTS"
```

Present the output to the user. The output includes:

- Feature title, status, version, and tags
- Description (if present)
- All scenarios with their Given/When/Then steps

If multiple features match, the CLI lists them with IDs. Present these options to the user and ask which one they want.

If the command fails:

- If no feature is found, report that no matching feature exists
- If `.openepis.json` is missing, instruct the user to create it in the repo root with `apiUrl` and `projectId`
- If the server is unreachable, suggest checking that the OpenEpis API server is running
