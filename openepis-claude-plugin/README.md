# OpenEpis Claude Code Plugin

Query BDD features and context from OpenEpis within Claude Code.

## Prerequisites

- **`@openepis/cli`** installed globally (`npm i -g @openepis/cli`) or available via `npx`
- **`.openepis.json`** in the consuming repo root with `apiUrl` and `projectId`:

```json
{
  "apiUrl": "http://localhost:3000/api",
  "projectId": "your-project-uuid"
}
```

- A running OpenEpis server at the configured `apiUrl`

## Installation

### Local (development)

```bash
claude --plugin-dir ./openepis-claude-plugin
```

### From marketplace

_(Coming soon)_

## Available Skills

| Skill               | Command                             | Description                          |
| ------------------- | ----------------------------------- | ------------------------------------ |
| `openepis-features` | `/openepis:openepis-features`       | List all BDD features in the project |
| `openepis-bdd`      | `/openepis:openepis-bdd <feature>`  | View full BDD for a specific feature |
| `openepis-context`  | `/openepis:openepis-context <file>` | Find BDD related to a source file    |

### `/openepis:openepis-features`

Lists all features with titles, statuses, scenario counts, and tags.

### `/openepis:openepis-bdd <feature>`

Pass a feature name or ID to see full BDD detail including scenarios and Given/When/Then steps.

### `/openepis:openepis-context <file>`

Pass a source file path to find related BDD features grouped by relevance (HIGH/MED/LOW). Optionally use `-r <repo>` to scope the query to a specific repository.
