## 1. Type Definitions

- [x] 1.1 Create `apps/server/src/types.ts` with `RequestUser` interface (`{ id: string; email: string; name: string }`) and augment `FastifyRequest` to include `user: RequestUser`

## 2. Current User Plugin

- [x] 2.1 Create `apps/server/src/plugins/current-user.ts` Fastify plugin that `decorateRequest('user', ...)` and sets `request.user` to the current user in an `onRequest` hook (MVP-0: returns fixed default user)
- [x] 2.2 Add MVP-0 seed logic in the plugin: on register, upsert the default user (`00000000-0000-0000-0000-000000000001`, `system@openepis.dev`, `System`) into the `users` table
- [x] 2.3 Register the plugin in `apps/server/src/index.ts` before route registration

## 3. Route Refactoring

- [x] 3.1 Update `apps/server/src/routes/projects.ts`: replace hardcoded UUID `"00000000-0000-0000-0000-000000000001"` with `request.user.id` in `POST /api/projects`
- [x] 3.2 Update `apps/server/src/routes/features.ts`: replace hardcoded UUID in `created_by` and `changed_by` with `request.user.id` in both `POST` and `PUT` handlers
- [x] 3.3 Update `apps/server/src/routes/tasks.ts`: replace `"system"` string with `request.user.id` in `POST /api/projects/:id/init`

## 4. Verification

- [x] 4.1 Build the project (`pnpm build`) to verify TypeScript compilation passes
- [x] 4.2 Start the server and test creating a project to confirm `created_by` uses the default user ID
