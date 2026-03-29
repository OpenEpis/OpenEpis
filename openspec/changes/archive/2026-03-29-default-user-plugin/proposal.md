## Why

Multiple routes need a `created_by` / `changed_by` user ID to identify the current operator. A "current user" Fastify plugin is needed to provide the current request's user info uniformly via `request.user`. In MVP-0, since authentication is not implemented, this plugin returns a fixed default user. When real auth is introduced in MVP-1, only this plugin's implementation needs to be replaced — route code remains unchanged.

## What Changes

- Add a Fastify current-user plugin (`current-user`) that decorates every request with `request.user`, providing the current user object
- MVP-0 implementation: the plugin returns a fixed default system user `00000000-0000-0000-0000-000000000001`
- Ensure the default user exists in the database (seed data)
- Replace all hardcoded user IDs in routes with `request.user.id`
- Fix `tasks.ts` which still uses the invalid `"system"` string
- Extend Fastify type declarations so `request.user` has correct TypeScript types

## Capabilities

### New Capabilities

- `current-user`: Fastify current-user plugin providing `request.user` to access the current operating user. MVP-0 returns a default user; MVP-1 replaces with real auth

### Modified Capabilities

- `project-api`: Route `created_by` changed from hardcoded value to `request.user.id`
- `feature-api`: Route `created_by` / `changed_by` changed from hardcoded values to `request.user.id`
- `task-api`: Route `created_by` changed from invalid string `"system"` to `request.user.id`

## Impact

- **Code**: `apps/server/src/` — added `plugins/current-user.ts`, modified `index.ts` to register plugin, modified all route files
- **Types**: server-local types — extended Fastify's `FastifyRequest` with a `user` property
- **Database**: Seed required to ensure default user exists (MVP-0)
- **API**: No external API changes, behavior unchanged
