# CLAUDE.md

## Project Overview

OpenEpis is a PM-Developer collaboration platform where **BDD (Behavior-Driven Development) documents are the single source of truth** between product requirements and engineering implementation. PMs write PRDs and review AI-generated BDD; developers consume BDD via REST API / Claude Code Skill.

**Current phase**: MVP-0 (BDD infrastructure + developer-facing integration). Conversational PRD-to-BDD generation is deferred to MVP-1.

## Monorepo Structure

```
apps/
  server/       @openepis/server    — Fastify REST API (main backend)
  web/          @openepis/web       — React + Vite frontend
  cli/          @openepis/cli       — CLI tool (citty)
packages/
  types/        @openepis/types     — Shared TypeScript types
  sdk/          @openepis/sdk       — Client SDK (used by web + cli)
  storage/      @openepis/storage   — Storage interface layer (abstract)
  storage-pg/   @openepis/storage-pg — PostgreSQL implementation (Drizzle ORM)
```

## Tech Stack

- **Runtime**: Node.js + TypeScript (ESM throughout, `"type": "module"`)
- **Backend**: Fastify 5
- **Frontend**: React 19 + Vite 8
- **Database**: PostgreSQL + Drizzle ORM (`postgres` driver)
- **Monorepo**: pnpm 10 + Turborepo
- **Linting**: ESLint 9 + Prettier
- **Commits**: Conventional Commits (enforced by commitlint + husky)
- **CLI**: citty

## Key Commands

```bash
pnpm install                  # Install dependencies
pnpm dev                      # Run all dev servers (turbo)
pnpm dev:server               # Run API server only
pnpm dev:web                  # Run web frontend only
pnpm build                    # Build all packages
pnpm lint                     # Lint all packages
pnpm format                   # Format all packages

# Database (PostgreSQL via Drizzle)
pnpm db:pg:generate           # Generate migrations
pnpm db:pg:migrate            # Run migrations
pnpm db:pg:push               # Push schema directly (dev)
pnpm db:pg:studio             # Open Drizzle Studio
```

## Environment

Copy `.env.example` to `.env` and configure:

```
DATABASE_URL=postgres://user:password@localhost:5432/openepis
```

## Architecture Decisions

- **BDD lives in PostgreSQL, not Git** — enables structured editing, versioning, cross-repo features, and PM-friendly web UI
- **Storage abstraction layer** — `@openepis/storage` defines interfaces, `@openepis/storage-pg` implements them. Server depends on interfaces, not concrete implementations
- **Lightweight DI container** — `apps/server/src/container.ts` uses a Symbol-keyed container (no decorator-based DI)
- **Async tasks for long operations** — BDD initialization returns a task ID immediately; client polls for progress
- **Multi-LLM support planned** — LLM behind a provider interface (Claude, OpenAI, Ollama); MVP uses single provider via env
- **Claude Code integration via Skill** — thin REST API wrapper, not MCP

## API Design

Base URL: `/api`. All endpoints return JSON. Errors follow `{ "error": { "code": "...", "message": "..." } }`.

Key route files in `apps/server/src/routes/`:

- `projects.ts` — Project CRUD
- `repositories.ts` — Repository linking
- `features.ts` — BDD Feature/Scenario CRUD (with revision history)
- `context.ts` — File-to-BDD context matching (developer-facing)
- `tasks.ts` — Async task status polling

## Data Model

PostgreSQL with UUID PKs and `created_at`/`updated_at` on all tables. BDD versioning: every edit creates a `feature_revisions` record with a full JSONB snapshot. Scenario steps stored as JSONB arrays of `{ type, text }`.

Core tables: `users`, `projects`, `project_members`, `repositories`, `features`, `scenarios`, `feature_revisions`, `prd_documents`, `conversations`, `async_tasks`, `llm_configs`.

Schema defined in `packages/storage-pg/src/schema/`.

## Coding Conventions

- ESM imports only (no CommonJS)
- Conventional Commits enforced: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`
- lint-staged runs ESLint + Prettier on pre-commit
- Storage interfaces in `packages/storage/src/interfaces/`, implementations in `packages/storage-pg/src/repositories/`
- Drizzle schema files in `packages/storage-pg/src/schema/`
- Keep `@openepis/types` as the single source of shared type definitions
