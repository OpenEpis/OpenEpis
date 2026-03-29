## Context

`apps/web` is a bare React + Vite scaffold with only a placeholder `App.tsx`. The backend API (`apps/server`) and SDK (`packages/sdk`) are fully implemented with endpoints for projects, repositories, features, scenarios, revisions, and tasks. The web app needs to be built from scratch to consume these APIs and provide PM-facing project management and BDD browsing.

The user has specified the tech stack: shadcn/ui, Tailwind CSS, Jotai, TanStack React Query, React Router.

## Goals / Non-Goals

**Goals:**

- Functional project management UI (list, create, detail, repo config)
- BDD browsing UI (feature list, feature detail with scenarios, revision history)
- Solid foundation: routing, layout, SDK integration, data fetching, state management
- Document tech choices in `apps/web/README.md`

**Non-Goals:**

- BDD editing (structured editor for creating/updating Features and Scenarios) — separate change
- Authentication / authorization enforcement
- PRD editor or conversational BDD generation (MVP-1)
- Real-time collaboration or notifications
- BDD initialization trigger from web UI (can be done later)

## Decisions

### 1. Routing: React Router v7

**Choice**: React Router v7 with `createBrowserRouter` and data loaders.

**Route structure**:

```
/                          → redirect to /projects
/projects                  → ProjectListPage
/projects/new              → CreateProjectPage
/projects/:projectId       → ProjectDetailPage (overview + repos)
/projects/:projectId/features          → FeatureListPage
/projects/:projectId/features/:featureId → FeatureDetailPage (scenarios + steps)
/projects/:projectId/features/:featureId/revisions → FeatureRevisionsPage
```

**Why**: React Router is the most mature React routing library. v7 supports data loaders and nested layouts natively. Routes are nested under a shared `ProjectLayout` for consistent sidebar/breadcrumb navigation.

### 2. Data Fetching: TanStack React Query + @openepis/sdk

**Choice**: Wrap `@openepis/sdk` methods in React Query hooks.

**Pattern**:

- Create a singleton `OpenEpisClient` instance configured with the API base URL
- Create custom hooks: `useProjects()`, `useProject(id)`, `useFeatures(projectId)`, `useFeature(id)`, `useRevisions(featureId)`
- Mutations via `useMutation` for create/update/delete with `queryClient.invalidateQueries` for cache refresh

**Why**: React Query handles caching, deduplication, background refetching, loading/error states. The SDK already has clean methods matching every endpoint. This combination avoids manual fetch logic.

### 3. State Management: Jotai

**Choice**: Jotai for client-side UI state only.

**What goes in Jotai**: sidebar open/collapsed state, theme preference, UI filters, selected items.
**What stays in React Query**: all server state (projects, features, etc.).

**Why**: Jotai is minimal and atomic — fits well as a complement to React Query for local UI state without overlapping concerns.

### 4. UI Components: shadcn/ui + Tailwind CSS

**Choice**: shadcn/ui (copy-paste components on top of Radix primitives) with Tailwind CSS v4.

**Key components needed**: Button, Card, Badge, Table, Dialog, Sheet (mobile sidebar), Input, Textarea, Select, Breadcrumb, Tabs, Skeleton (loading states), DropdownMenu, Separator.

**Why**: shadcn/ui gives full control over component code (no opaque dependency), looks polished out of the box, uses Radix for accessibility, and pairs natively with Tailwind.

### 5. Layout Architecture

```
AppLayout
├── Sidebar (project list, nav links)
├── Header (breadcrumbs, actions)
└── Main content (routed pages)
```

- Sidebar shows project list and navigation for the currently selected project
- Responsive: collapsible sidebar on desktop, sheet/drawer on mobile
- Breadcrumbs auto-derived from route hierarchy

### 6. SDK Client Setup

A single `OpenEpisClient` instance created at app startup, provided through React context or module-level singleton. Base URL from environment variable `VITE_API_URL` (defaults to `/api` for same-origin proxy in dev).

Vite dev server proxy config forwards `/api` to the backend server to avoid CORS in development.

## Risks / Trade-offs

- **Risk**: shadcn/ui init may require manual Tailwind/PostCSS setup in the existing Vite config → **Mitigation**: Follow shadcn/ui Vite installation guide step by step; verify with `pnpm dev` before building pages
- **Risk**: Large number of new dependencies in one change → **Mitigation**: This is a greenfield web app; the dependencies are all standard and well-maintained
- **Trade-off**: Read-only browsing without editing in this change means PMs can't modify BDD yet → **Accepted**: Editing is complex enough to be a separate change; browsing provides immediate value
- **Trade-off**: No authentication means any user can see/create projects → **Accepted**: MVP-0 explicitly defers auth
