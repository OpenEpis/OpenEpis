## Why

The MVP-0 plan includes Project Management and BDD Browsing as core web UI features, but `apps/web` currently only has a placeholder "Welcome" page. PMs need a functional web interface to create/manage projects, configure repositories, and browse BDD Features/Scenarios. Without this, the only way to interact with the system is through the API or CLI.

## What Changes

- Set up the web app foundation: routing (React Router), state management (Jotai), data fetching (TanStack React Query + `@openepis/sdk`), UI components (shadcn/ui), styling (Tailwind CSS)
- Implement **Project Management** pages: project list, project creation, project detail with repository configuration
- Implement **BDD Browsing** pages: feature list within a project, feature detail with scenarios and BDD steps, feature revision history
- Implement shared layout: sidebar navigation, responsive shell
- Document tech stack choices in `apps/web/README.md`

## Capabilities

### New Capabilities

- `web-foundation`: Web app infrastructure — routing, layout, SDK integration, state management, UI component library setup
- `web-project-management`: Project list, create, detail, and repository management pages
- `web-bdd-browsing`: BDD Feature list, Feature detail with Scenarios, revision history browsing

### Modified Capabilities

<!-- No existing spec-level requirement changes -->

## Impact

- **Code**: `apps/web/` — major changes (new pages, components, routing, providers)
- **Dependencies**: New npm packages — `react-router`, `@tanstack/react-query`, `jotai`, `tailwindcss`, `shadcn/ui` (+ radix primitives), `lucide-react`
- **APIs consumed**: All existing REST endpoints via `@openepis/sdk` — projects CRUD, repositories CRUD, features list/detail, revisions
- **No backend changes required** — all API endpoints already exist
