## 1. Foundation Setup

- [x] 1.1 Install dependencies: react-router, @tanstack/react-query, jotai, tailwindcss v4, lucide-react, class-variance-authority, clsx, tailwind-merge
- [x] 1.2 Configure Tailwind CSS v4 (PostCSS config, global CSS with @import "tailwindcss", CSS variables for shadcn/ui theming)
- [x] 1.3 Initialize shadcn/ui: add `components.json`, create `lib/utils.ts` (cn helper), install base components (Button, Card, Badge, Input, Textarea, Dialog, Sheet, Skeleton, Separator, DropdownMenu, Breadcrumb, Tabs, Table, Select)
- [x] 1.4 Configure Vite dev proxy: forward `/api` requests to `http://localhost:3000`
- [x] 1.5 Create SDK client singleton (`src/lib/api.ts`): instantiate `OpenEpisClient` with `VITE_API_URL` env variable

## 2. React Query & Data Hooks

- [x] 2.1 Set up `QueryClientProvider` in app entry point (`main.tsx`)
- [x] 2.2 Create project hooks (`src/hooks/use-projects.ts`): `useProjects()`, `useProject(id)`, `useCreateProject()`, `useUpdateProject()`, `useDeleteProject()`
- [x] 2.3 Create repository hooks (`src/hooks/use-repositories.ts`): `useRepositories(projectId)`, `useCreateRepository()`, `useDeleteRepository()`
- [x] 2.4 Create feature hooks (`src/hooks/use-features.ts`): `useFeatures(projectId, query?)`, `useFeature(id)`, `useRevisions(featureId)`, `useRevision(featureId, version)`

## 3. Routing & Layout

- [x] 3.1 Set up React Router with `createBrowserRouter` in `src/router.tsx`: define all routes with nested layout structure
- [x] 3.2 Create `AppLayout` component: sidebar + header + main content area with responsive behavior
- [x] 3.3 Create `Sidebar` component: project list navigation, project-specific nav (Overview, Features) when inside a project, collapsible on desktop, Sheet on mobile
- [x] 3.4 Create `Header` component with dynamic breadcrumbs derived from route hierarchy
- [x] 3.5 Create Jotai atoms for UI state (`src/store/ui.ts`): sidebar collapsed state
- [x] 3.6 Create 404 NotFound page component

## 4. Project Management Pages

- [x] 4.1 Create `ProjectListPage`: fetch projects with `useProjects()`, render as cards with name/date/feature count, empty state, loading skeletons, "Create Project" button
- [x] 4.2 Create `CreateProjectPage`: form with name (required) + description (optional), validation, submit via `useCreateProject()`, navigate to project detail on success
- [x] 4.3 Create `ProjectDetailPage`: fetch project with `useProject(id)`, display name/description/feature count, repository list section
- [x] 4.4 Create repository management section on project detail: list repos, add repo dialog (name + git URL + branch), delete repo with confirmation

## 5. BDD Browsing Pages

- [x] 5.1 Create `FeatureListPage`: fetch features with `useFeatures(projectId)`, render as list/cards with title/status badge/tags/scenario count/updated date, status filter dropdown, search input, empty state, loading skeletons
- [x] 5.2 Create `FeatureDetailPage`: fetch feature with `useFeature(id)`, display title/description/status/version/tags, render all scenarios with BDD steps (Given/When/Then color-coded), tab/link to revisions
- [x] 5.3 Create `BddSteps` component: renders scenario steps with distinct visual styling per step type (Given = green, When = blue, Then = purple, And = gray)
- [x] 5.4 Create `FeatureRevisionsPage`: fetch revisions with `useRevisions(featureId)`, display chronological list with version/summary/author/date, click to view historical snapshot
- [x] 5.5 Create revision detail view: fetch specific revision with `useRevision(featureId, version)`, display full feature snapshot with scenarios and steps

## 6. Documentation

- [x] 6.1 Write `apps/web/README.md` documenting tech stack choices (React Router, Jotai, TanStack React Query, shadcn/ui, Tailwind CSS), project structure, development commands, and key patterns
