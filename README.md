# OpenEpis

PM-Developer collaboration platform where **BDD (Behavior-Driven Development) documents are the single source of truth** between product requirements and engineering implementation.

PMs write PRDs and review AI-generated BDD; developers consume BDD via REST API or Claude Code Skill.

> **Current phase**: MVP-0 — BDD infrastructure + developer-facing integration.

## Architecture

```
apps/
  server/         Fastify REST API (main backend)
  web/            React + Vite frontend
  cli/            CLI tool (citty)
packages/
  types/          Shared TypeScript types
  core/           BDD agent core (AI pipeline)
  sdk/            Client SDK (used by web + cli)
  storage/        Storage interface layer (abstract)
  storage-pg/     PostgreSQL implementation (Drizzle ORM)
```

### Dependency Graph

```
              @openepis/types
             /    |    \     \
          sdk   core  storage  server
         / \      \      |
       web  cli   server storage-pg
```

## Tech Stack

| Layer    | Technology                                    |
| -------- | --------------------------------------------- |
| Runtime  | Node.js + TypeScript (ESM)                    |
| Backend  | Fastify 5                                     |
| Frontend | React 19 + Vite 8 + Tailwind CSS 4            |
| Database | PostgreSQL + Drizzle ORM                      |
| State    | Jotai (client), TanStack Query (server state) |
| Routing  | React Router 7                                |
| i18n     | i18next                                       |
| UI       | Radix UI + Lucide icons                       |
| Monorepo | pnpm 10 + Turborepo                           |
| Linting  | ESLint 9 + Prettier                           |
| Testing  | Playwright (e2e)                              |
| Commits  | Conventional Commits (commitlint + husky)     |

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm 10
- PostgreSQL

### Setup

```bash
# Clone and install
git clone <repo-url>
cd openepis
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL and encryption key
```

### Environment Variables

| Variable         | Description                                                                            |
| ---------------- | -------------------------------------------------------------------------------------- |
| `DATABASE_URL`   | PostgreSQL connection string                                                           |
| `ENCRYPTION_KEY` | 32-byte hex key for encrypting API keys at rest. Generate with: `openssl rand -hex 32` |

### Database

```bash
pnpm db:pg:push       # Push schema directly (dev)
# or
pnpm db:pg:generate   # Generate migrations
pnpm db:pg:migrate    # Run migrations

pnpm db:pg:studio     # Open Drizzle Studio (visual DB browser)
```

### Development

```bash
pnpm dev              # Run all dev servers (API + Web)
pnpm dev:server       # Run API server only
pnpm dev:web          # Run web frontend only
```

## Scripts

| Command         | Description                       |
| --------------- | --------------------------------- |
| `pnpm dev`      | Start all dev servers             |
| `pnpm build`    | Build all packages                |
| `pnpm lint`     | Lint all packages                 |
| `pnpm format`   | Format all packages               |
| `pnpm test:e2e` | Run Playwright e2e tests          |
| `pnpm eval`     | Run LLM-as-Judge evaluation suite |

## API

Base URL: `/api`. All endpoints return JSON.

### Routes

| Route                | Description                                       |
| -------------------- | ------------------------------------------------- |
| `/api/projects`      | Project CRUD                                      |
| `/api/repositories`  | Repository linking                                |
| `/api/features`      | BDD Feature/Scenario CRUD (with revision history) |
| `/api/context`       | File-to-BDD context matching (developer-facing)   |
| `/api/tasks`         | Async task status polling                         |
| `/api/conversations` | BDD generation conversations                      |
| `/api/llm-configs`   | LLM provider configuration                        |

### Error Format

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Project not found"
  }
}
```

## Data Model

PostgreSQL with UUID primary keys and `created_at`/`updated_at` timestamps on all tables.

**Core tables**: `users`, `projects`, `project_members`, `repositories`, `features`, `scenarios`, `feature_revisions`, `prd_documents`, `conversations`, `async_tasks`, `llm_configs`

BDD versioning: every edit creates a `feature_revisions` record with a full JSONB snapshot. Scenario steps stored as JSONB arrays of `{ type, text }`.

## Design Decisions

- **BDD lives in PostgreSQL, not Git** — enables structured editing, versioning, cross-repo features, and PM-friendly web UI
- **Storage abstraction layer** — `@openepis/storage` defines interfaces, `@openepis/storage-pg` implements them. Server depends on interfaces, not concrete implementations
- **Lightweight DI container** — Symbol-keyed container in `apps/server/src/container.ts` (no decorator-based DI)
- **Async tasks for long operations** — BDD initialization returns a task ID immediately; client polls for progress
- **Multi-LLM support** — LLM behind a provider interface (Claude, OpenAI, Ollama)
