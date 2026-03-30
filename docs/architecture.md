# OpenEpis Architecture

## System Overview

```
┌─────────────────────────┐        ┌───────────────────────┐
│    Web App (React)       │        │  Claude Code Skill     │
│                         │        │  (thin API wrapper)    │
│  - Project management   │        │                       │
│  - PRD editing          │        │  /openepis features   │
│  - Conversational BDD   │        │  /openepis bdd        │
│  - BDD browse/edit      │        │  /openepis context    │
│  - Repo configuration   │        │                       │
└────────┬────────────────┘        └──────────┬────────────┘
         │                                    │
         ▼                                    ▼
┌─────────────────────────────────────────────────────────┐
│                  OpenEpis API (Fastify)                   │
│                                                         │
│  /api/projects         - Project CRUD                   │
│  /api/repositories     - Repository configuration       │
│  /api/features         - BDD Feature CRUD               │
│  /api/scenarios        - BDD Scenario CRUD              │
│  /api/prd              - PRD document management        │
│  /api/conversations    - Conversational BDD generation  │
│  /api/init             - Codebase → BDD initialization  │
│  /api/tasks            - Async task status              │
└────────┬────────────────────────────┬───────────────────┘
         │                            │
         ▼                            ▼
┌─────────────────┐        ┌───────────────────┐
│   PostgreSQL     │        │  @openepis/core   │
│                 │        │  (Agent Engine)   │
│  All persistent │        │                   │
│  state          │        │  Pi Agent Core +  │
│                 │        │  Pi AI            │
│                 │        │                   │
│                 │        │  - BDD generation │
│                 │        │  - Context assembly│
│                 │        │  - Tool execution │
└─────────────────┘        └───────────────────┘
```

## Tech Stack

| Layer     | Technology                                           | Notes                                                                                 |
| --------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Frontend  | React + Vite + TypeScript                            | Already scaffolded in `apps/web`                                                      |
| Backend   | Fastify + TypeScript                                 | Already scaffolded in `apps/server`                                                   |
| Database  | PostgreSQL                                           | Structured BDD data + conversation history                                            |
| ORM/Query | Drizzle ORM                                          | PostgreSQL with `postgres` driver                                                     |
| AI        | Pi Agent Core + Pi AI (Claude, OpenAI, Ollama, etc.) | Agent workflow engine, see [core-agent-architecture.md](./core-agent-architecture.md) |
| Monorepo  | pnpm + Turborepo                                     | Already configured                                                                    |

## Key Architectural Decisions

### 1. BDD in Database, Not Git

**Decision**: Store BDD in PostgreSQL, not as files in Git repositories.

**Reasons**:

- PM edits through Web UI, not Git workflows
- Structured data enables querying, versioning, access control
- BDD is cross-repo (one Feature can span frontend + backend)
- Avoids confusion between "BDD files in repo" vs "source of truth in platform"

### 2. Agent-based BDD Generation with Pi

**Decision**: Use [pi-agent-core](https://github.com/badlogic/pi-mono/tree/main/packages/agent) + [pi-ai](https://github.com/badlogic/pi-mono/tree/main/packages/ai) as the agent runtime for conversational BDD generation. Replaces the previous `@openepis/llm` package (Vercel AI SDK wrapper).

**Why Pi over Vercel AI SDK**: Pi provides a stateful `Agent` class with structured events, `transformContext` hooks, tool execution control, and mid-run steering — all features needed for the BDD agent workflow that Vercel AI SDK's `streamText` does not offer.

**Architecture**: `@openepis/core` wraps Pi Agent, defines domain tools (`update_bdd`, `get_feature_detail`, `search_features`), and exposes a `createBddAgent()` factory. Storage access is injected via `IBddContextService` (dependency inversion).

**Configuration levels**:

- Platform-level: default provider for the deployment (stored in `llm_configs` table)
- Project-level: override per project
- `core` receives resolved `{ provider, modelId, apiKey }` — does not read DB directly

See [core-agent-architecture.md](./core-agent-architecture.md) for full design.

### 3. Server-side Code Clone for Initialization

**Decision**: When initializing BDD from code, the server clones repos and analyzes them.

**Process**:

1. Shallow clone (`--depth=1 --single-branch`)
2. Scan directory structure, identify frameworks/patterns
3. Extract routes, components, models, existing tests
4. Send to LLM in batches for BDD generation
5. Clean up cloned code (never persist source)

**Security considerations**:

- Git credentials (access tokens / deploy keys) stored encrypted in DB
- Cloned code exists only during analysis, deleted after
- Clone runs in isolated temp directory

### 4. Async Task Processing

**Decision**: Long-running operations (BDD initialization, BDD generation) are async tasks.

**Flow**:

```
Client request → API returns { taskId, status: "queued" }
                → Background worker processes
                → Client polls / WebSocket for progress
                → Task completes → client fetches result
```

### 5. Claude Code Integration via Skill (not MCP)

**Decision**: Provide a thin Claude Code Skill that wraps the REST API.

**Why Skill over MCP**:

- Lighter weight — just HTTP calls, no protocol server to run
- Works with any Claude Code setup, no plugin install
- API-first design means other agents/tools can also integrate

**Skill commands**:

```
/openepis features          → GET /api/projects/:id/features
/openepis bdd <name>        → GET /api/features/:id/full
/openepis context <file>    → POST /api/projects/:id/context
/openepis diff              → GET /api/projects/:id/bdd-changes (recent changes)
```
