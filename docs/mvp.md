# OpenEpis MVP Plan

## MVP-0 Scope

The first usable version focuses on establishing the BDD infrastructure and developer-facing integration. The most complex feature (conversational PRD → BDD) is deferred to MVP-1.

### Included

| Feature                        | Description                                                          |
| ------------------------------ | -------------------------------------------------------------------- |
| Project management             | Create projects, configure metadata                                  |
| Repository configuration       | Link multiple Git repos to a project                                 |
| Codebase → BDD initialization  | Clone repos, analyze code, auto-generate initial BDD                 |
| BDD browsing (Web UI)          | View all Features and Scenarios in a project                         |
| BDD editing (Web UI)           | PM can add/edit/delete Features and Scenarios with structured editor |
| BDD version history            | Every edit creates a revision, full history browsable                |
| BDD REST API                   | Read-only API for external consumers                                 |
| Claude Code Skill              | Thin wrapper over API for developer experience                       |
| User table + basic user system | Data model ready, no auth enforcement                                |
| Single LLM provider            | One provider configured via environment variable                     |

### Excluded (deferred to MVP-1)

| Feature                             | Why deferred                                               |
| ----------------------------------- | ---------------------------------------------------------- |
| PRD writing in Web UI               | BDD can be created directly or via initialization          |
| Conversational PRD → BDD generation | Most complex feature, needs solid BDD infrastructure first |
| Multi-LLM provider selection        | Platform-level config is enough for MVP                    |
| Authentication & authorization      | User table exists but no login/permission enforcement      |
| Real-time collaboration             | Single PM editing at a time is fine initially              |

## MVP-1 Scope (tentative)

- PRD editor in Web UI
- Conversational PRD → BDD generation (the core differentiator)
- BDD change notifications for developers
- Authentication (GitHub OAuth or similar)
- Role-based access control (PM write, Dev read-only)

## MVP-2 Scope (tentative)

- Multi-LLM provider configuration per project
- BDD diff view (what changed between versions)
- BDD-to-test mapping / coverage tracking
- Self-bootstrapping: OpenEpis manages its own BDD

## Technical Approach for MVP-0

### Web UI

- React + Vite (already scaffolded)
- UI library: TBD (shadcn/ui, Ant Design, or similar)
- Pages:
  - Project list / create
  - Project detail (repos, settings)
  - BDD browser (feature list → scenario detail)
  - BDD editor (structured form for Feature + Scenarios)
  - Initialization progress view

### API

- Fastify (already scaffolded)
- RESTful JSON API
- Key endpoints:
  - `POST /api/projects` — create project
  - `GET /api/projects/:id` — get project detail
  - `POST /api/projects/:id/repositories` — add repo
  - `POST /api/projects/:id/init` — trigger BDD initialization (async)
  - `GET /api/projects/:id/features` — list features
  - `GET /api/features/:id` — get feature with scenarios
  - `PUT /api/features/:id` — update feature (creates revision)
  - `POST /api/features` — create feature
  - `GET /api/tasks/:id` — check async task status
  - `POST /api/projects/:id/context` — find BDD related to a file path

### Database

- PostgreSQL
- Migration tool: TBD (node-pg-migrate, Drizzle migrations, Prisma migrate)
- See [data-model.md](./data-model.md) for full schema

### BDD Initialization Pipeline

```
Trigger: POST /api/projects/:id/init
  │
  ├─ Create async_task (status: queued)
  ├─ Return { taskId } immediately
  │
  ▼ Background worker:
  │
  ├─ For each repository in project:
  │   ├─ git clone --depth=1 --single-branch <url> <tmpdir>
  │   ├─ Scan directory tree
  │   ├─ Identify framework (package.json, requirements.txt, etc.)
  │   ├─ Extract key structures:
  │   │   ├─ Routes / API endpoints
  │   │   ├─ React components / pages
  │   │   ├─ Database models / schemas
  │   │   └─ Existing test descriptions
  │   ├─ Batch send to LLM for BDD generation
  │   └─ rm -rf <tmpdir>
  │
  ├─ Merge and deduplicate generated Features
  ├─ Save as draft Features in database
  ├─ Update async_task (status: completed)
  │
  ▼ PM reviews draft Features in Web UI
```

### Claude Code Skill

A skill definition file that registers commands mapping to API calls:

```
/openepis features          → GET /api/projects/:id/features
/openepis bdd <name|id>     → GET /api/features/:id
/openepis context <file>    → POST /api/projects/:id/context
/openepis diff              → GET /api/projects/:id/changes?since=<24h>
```

The skill needs project configuration (API URL + project ID) stored locally, e.g., in `.openepis.json` in the repo root.
