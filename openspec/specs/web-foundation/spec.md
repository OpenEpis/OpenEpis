## ADDED Requirements

### Requirement: App routing with React Router

The web app SHALL use React Router v7 with `createBrowserRouter` to define all routes. The root path (`/`) SHALL redirect to `/projects`. All routes SHALL be nested under a shared root layout component that provides the application shell (sidebar + header + main content area).

#### Scenario: Root redirect

- **WHEN** user navigates to `/`
- **THEN** user is redirected to `/projects`

#### Scenario: Unknown route

- **WHEN** user navigates to an undefined route
- **THEN** a 404 "Page not found" view is displayed within the app layout

### Requirement: Application layout shell

The app SHALL render a responsive layout with a sidebar, header with breadcrumbs, and main content area. The sidebar SHALL be collapsible on desktop and rendered as a sheet/drawer on mobile viewports. The sidebar SHALL display project navigation links.

#### Scenario: Desktop layout

- **WHEN** user views the app on a viewport wider than 768px
- **THEN** the sidebar is visible and collapsible, header shows breadcrumbs, and main content fills the remaining space

#### Scenario: Mobile layout

- **WHEN** user views the app on a viewport 768px or narrower
- **THEN** the sidebar is hidden by default and accessible via a menu button that opens a sheet/drawer overlay

### Requirement: SDK client integration

The app SHALL create a singleton `OpenEpisClient` instance from `@openepis/sdk` configured with the API base URL from `VITE_API_URL` environment variable (defaulting to empty string for same-origin). The client instance SHALL be accessible to all data-fetching hooks.

#### Scenario: SDK client initialization

- **WHEN** the app starts
- **THEN** an `OpenEpisClient` instance is created with the configured base URL and available for use in query hooks

### Requirement: React Query provider

The app SHALL wrap the component tree with a `QueryClientProvider` from TanStack React Query. Custom hooks SHALL be provided for each SDK resource: `useProjects`, `useProject`, `useFeatures`, `useFeature`, `useRepositories`, `useRevisions`.

#### Scenario: Data fetching with caching

- **WHEN** a component calls `useProjects()`
- **THEN** React Query fetches the project list via the SDK client, caches the result, and provides `data`, `isLoading`, and `error` states

### Requirement: Jotai state management

The app SHALL use Jotai for client-side UI state (sidebar collapsed state, UI preferences). Server data SHALL NOT be stored in Jotai atoms — all server state is managed by React Query.

#### Scenario: Sidebar state persistence

- **WHEN** user toggles the sidebar collapsed state
- **THEN** the state is stored in a Jotai atom and reflected immediately in the UI

### Requirement: Tailwind CSS and shadcn/ui setup

The app SHALL use Tailwind CSS v4 for styling and shadcn/ui for UI components. The Vite config SHALL include necessary PostCSS/Tailwind configuration. shadcn/ui components SHALL be installed into the project source (not as a dependency).

#### Scenario: Tailwind styles applied

- **WHEN** the app is built or served in dev mode
- **THEN** Tailwind utility classes are processed and applied to all components

### Requirement: Vite dev proxy

The Vite dev server SHALL proxy `/api` requests to the backend server (default `http://localhost:3000`) to avoid CORS issues during local development.

#### Scenario: API proxy in development

- **WHEN** the web dev server receives a request to `/api/*`
- **THEN** the request is proxied to the backend server at `http://localhost:3000/api/*`

### Requirement: Tech stack documentation

The file `apps/web/README.md` SHALL document the web app's tech stack choices, including routing, state management, data fetching, UI library, styling, and key architectural patterns.

#### Scenario: README exists with tech stack

- **WHEN** a developer reads `apps/web/README.md`
- **THEN** they find documented decisions for React Router, Jotai, TanStack React Query, shadcn/ui, and Tailwind CSS with brief rationale
