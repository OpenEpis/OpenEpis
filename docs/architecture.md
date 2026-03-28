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
│   PostgreSQL     │        │   AI Service      │
│                 │        │   (LLM Adapter)   │
│  All persistent │        │                   │
│  state          │        │  - Analyze PRD    │
│                 │        │  - Retrieve BDD   │
│                 │        │  - Generate Qs    │
│                 │        │  - Generate BDD   │
│                 │        │  - Analyze code   │
└─────────────────┘        └───────────────────┘
```

## Tech Stack

| Layer     | Technology                              | Notes                                         |
| --------- | --------------------------------------- | --------------------------------------------- |
| Frontend  | React + Vite + TypeScript               | Already scaffolded in `apps/web`              |
| Backend   | Fastify + TypeScript                    | Already scaffolded in `apps/server`           |
| Database  | PostgreSQL                              | Structured BDD data + conversation history    |
| ORM/Query | TBD (Drizzle / Prisma / Kysely)         |                                               |
| AI        | Multi-provider (Claude, OpenAI, Ollama) | Unified interface, provider-specific adapters |
| Monorepo  | pnpm + Turborepo                        | Already configured                            |

## Key Architectural Decisions

### 1. BDD in Database, Not Git

**Decision**: Store BDD in PostgreSQL, not as files in Git repositories.

**Reasons**:

- PM edits through Web UI, not Git workflows
- Structured data enables querying, versioning, access control
- BDD is cross-repo (one Feature can span frontend + backend)
- Avoids confusion between "BDD files in repo" vs "source of truth in platform"

### 2. Multi-LLM Provider Support

**Decision**: Abstract LLM behind a provider interface; support Claude, OpenAI, Ollama.

**Interface**:

```typescript
interface LLMProvider {
  chat(messages: Message[], options: ChatOptions): AsyncIterable<ChatChunk>;
  analyze(content: string, prompt: string): Promise<AnalysisResult>;
}
```

**Configuration levels** (future):

- Platform-level: default provider for the deployment
- Project-level: override per project
- MVP: platform-level only, single provider configured via env

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
