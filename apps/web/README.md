# @openepis/web

Web frontend for OpenEpis — project management and BDD browsing UI.

## Tech Stack

| Layer             | Choice                                 | Rationale                                                                                                       |
| ----------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Routing**       | React Router v7                        | Mature, supports nested layouts and breadcrumbs natively via `createBrowserRouter`                              |
| **Data fetching** | TanStack React Query + `@openepis/sdk` | Handles caching, deduplication, loading/error states. SDK already provides typed methods for every API endpoint |
| **Client state**  | Jotai                                  | Minimal atomic state for UI concerns (sidebar toggle, preferences). Server state stays in React Query           |
| **Components**    | shadcn/ui (Radix primitives)           | Copy-paste components — full control, accessible, Tailwind-native                                               |
| **Styling**       | Tailwind CSS v4                        | Utility-first CSS with CSS-variable-based theming for shadcn/ui                                                 |
| **Icons**         | Lucide React                           | Consistent icon set, tree-shakeable                                                                             |

## Project Structure

```
src/
  components/
    layout/       App shell — AppLayout, Sidebar, Header
    ui/           shadcn/ui components (Button, Card, Dialog, etc.)
    bdd-steps.tsx BDD step renderer with color-coded step types
  hooks/          React Query hooks wrapping @openepis/sdk
  lib/
    api.ts        SDK client singleton
    utils.ts      Tailwind cn() helper
  pages/          Route page components
  store/          Jotai atoms (UI state)
  router.tsx      React Router route definitions
  main.tsx        Entry point (QueryClientProvider, StrictMode)
  App.tsx         RouterProvider wrapper
  style.css       Tailwind imports + CSS theme variables
```

## Development

```bash
pnpm dev:web       # Start Vite dev server (port 3000)
pnpm dev           # Start all services (web + server)
pnpm build         # Production build
pnpm lint          # Run ESLint
pnpm format        # Run Prettier
```

The Vite dev server proxies `/api` requests to `http://localhost:3001` (the API server).

## Key Patterns

- **SDK client**: A module-level singleton `OpenEpisClient` in `src/lib/api.ts`, configured from `VITE_API_URL` env var (defaults to same-origin)
- **Data hooks**: Each resource has a dedicated hook file (`use-projects.ts`, `use-features.ts`, `use-repositories.ts`) wrapping SDK calls with React Query
- **Mutations**: Use `useMutation` with `invalidateQueries` for cache refresh after create/update/delete
- **Path alias**: `@/` maps to `src/` via Vite resolve alias and tsconfig paths
- **Breadcrumbs**: Route handles define `breadcrumb` strings, auto-rendered by the Header component via `useMatches()`
