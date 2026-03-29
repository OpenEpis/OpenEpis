## ADDED Requirements

### Requirement: Current user Fastify plugin

The server SHALL register a Fastify plugin that decorates every request with `request.user` containing the current user. The plugin SHALL use `decorateRequest` and an `onRequest` hook. The `request.user` object SHALL conform to the `RequestUser` interface: `{ id: string; email: string; name: string }`. In MVP-0 (no auth), the plugin SHALL return a fixed default user. In MVP-1, this plugin SHALL be replaced with a real auth implementation that resolves the user from the request token.

#### Scenario: Request has current user object

- **WHEN** any API request is received by the server
- **THEN** `request.user` SHALL be populated with the current user (MVP-0: `{ id: "00000000-0000-0000-0000-000000000001", email: "system@openepis.dev", name: "System" }`)

#### Scenario: Plugin contract is stable for future auth replacement

- **WHEN** the current-user plugin is replaced with a real auth plugin in MVP-1
- **THEN** all routes continue to work because they access `request.user.id` through the same `RequestUser` interface

### Requirement: Default user seed on startup (MVP-0)

In MVP-0, the plugin SHALL ensure the default user (`id: 00000000-0000-0000-0000-000000000001`, `email: system@openepis.dev`, `name: System`) exists in the `users` table when registered. If the user already exists, the operation SHALL be a no-op. This seed logic is specific to the MVP-0 stub implementation and will be removed when real auth is introduced.

#### Scenario: First startup with empty database

- **WHEN** the server starts and no user with id `00000000-0000-0000-0000-000000000001` exists
- **THEN** the user is inserted into the `users` table

#### Scenario: Subsequent startup with existing user

- **WHEN** the server starts and the user already exists
- **THEN** no error occurs and the existing record is preserved

### Requirement: TypeScript type declaration for request.user

The server SHALL extend Fastify's `FastifyRequest` type to include a `user` property of type `RequestUser`. This SHALL be declared in `apps/server/src/types.ts` so that all routes have type-safe access to `request.user`.

#### Scenario: Type-safe access in routes

- **WHEN** a route handler accesses `request.user.id`
- **THEN** TypeScript compiles without errors and the type is `string`
