## Why

The current monorepo only has `apps/*` in the workspace. The docs define a REST API (Fastify backend) consumed by both the Web UI and a future Claude Code Skill/CLI. Without shared packages, the web and server apps will duplicate API type definitions and HTTP client logic. Introducing `packages/types` and `packages/sdk` establishes a clean dependency graph: types define the API contract, the SDK wraps HTTP calls, and both apps consume the SDK rather than hand-rolling fetch calls.

## What Changes

- Add `packages/*` to the pnpm workspace
- Create `@openepis/types` package: TypeScript type definitions for all API request/response shapes, entity models, and error formats as defined in `docs/api.md` and `docs/data-model.md`
- Create `@openepis/sdk` package: a typed HTTP client that wraps every REST endpoint, returning typed responses. Framework-agnostic (works in browser and Node.js)
- Update `@openepis/web` to depend on `@openepis/sdk` for all API calls
- Update `@openepis/server` to depend on `@openepis/types` for request/response validation and handler typing
- Add a `@openepis/cli` app under `apps/cli` that uses `@openepis/sdk` for a terminal-based developer experience

## Capabilities

### New Capabilities

- `api-types`: Shared TypeScript type definitions for the OpenEpis REST API contract (entities, request/response shapes, error format)
- `api-sdk`: Typed HTTP SDK client wrapping all OpenEpis API endpoints, usable from browser and Node.js
- `cli-app`: CLI application for developers to interact with OpenEpis from the terminal (list features, view BDD, query context)

### Modified Capabilities

<!-- No existing specs to modify -->

## Impact

- **Workspace config**: `pnpm-workspace.yaml` adds `packages/*`; `turbo.json` may need build pipeline updates
- **Build order**: `types` builds first, `sdk` depends on `types`, apps depend on `sdk`/`types`
- **apps/web**: Gains `@openepis/sdk` dependency; API calls go through SDK instead of raw fetch
- **apps/server**: Gains `@openepis/types` dependency; route handlers use shared types for request/response
- **apps/cli**: New app, depends on `@openepis/sdk`
- **No breaking changes**: This is greenfield scaffolding on a project with no production code yet
