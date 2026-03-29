## 1. Workspace Configuration

- [x] 1.1 Update `pnpm-workspace.yaml` to include `packages/*` alongside `apps/*`
- [x] 1.2 Update `turbo.json` to ensure correct build ordering (packages build before apps)

## 2. @openepis/types Package

- [x] 2.1 Scaffold `packages/types/` with `package.json` (name: `@openepis/types`, main/types entry points) and `tsconfig.json` extending base
- [x] 2.2 Create entity interfaces: `Project`, `User`, `ProjectMember`, `Repository`, `Feature`, `Scenario`, `FeatureRevision`, `PrdDocument`, `Conversation`, `AsyncTask`, `LlmConfig`, `BddStep`
- [x] 2.3 Create API request types: `CreateProjectRequest`, `UpdateProjectRequest`, `CreateRepositoryRequest`, `CreateFeatureRequest`, `UpdateFeatureRequest`, `InitBddRequest`, `PostContextRequest`
- [x] 2.4 Create API response types: `ProjectListResponse`, `ProjectDetailResponse`, `FeatureListResponse`, `FeatureDetailResponse`, `FeatureRevisionsResponse`, `ContextResponse`, `TaskStatusResponse`, `AsyncTaskResponse`, `ApiError`
- [x] 2.5 Create `src/index.ts` barrel export and verify `tsc` build produces ESM + declaration files

## 3. @openepis/sdk Package

- [x] 3.1 Scaffold `packages/sdk/` with `package.json` (depends on `@openepis/types`) and `tsconfig.json` extending base
- [x] 3.2 Implement `OpenEpisClient` class with config (`baseUrl`, optional `fetch`) and internal HTTP helper
- [x] 3.3 Implement `OpenEpisApiError` class extending `Error` with `status`, `code`, `message` fields
- [x] 3.4 Implement `client.projects` resource: `list()`, `get(id)`, `create(data)`, `update(id, data)`, `delete(id)`
- [x] 3.5 Implement `client.features` resource: `list(projectId, query?)`, `get(id)`, `create(projectId, data)`, `update(id, data)`, `revisions(id)`, `revision(id, version)`
- [x] 3.6 Implement `client.repositories` resource: `list(projectId)`, `create(projectId, data)`, `delete(id)`
- [x] 3.7 Implement `client.context.query(projectId, data)` and `client.tasks.get(id)` and `client.init.trigger(projectId, data?)`
- [x] 3.8 Create barrel export and verify build

## 4. Apps Integration

- [x] 4.1 Add `@openepis/types` dependency to `apps/server/package.json`
- [x] 4.2 Add `@openepis/sdk` dependency to `apps/web/package.json`

## 5. @openepis/cli App

- [x] 5.1 Scaffold `apps/cli/` with `package.json` (depends on `@openepis/sdk`), `tsconfig.json`, and CLI entry point
- [x] 5.2 Implement config loading: find and parse `.openepis.json` from current or ancestor directories
- [x] 5.3 Implement `openepis features` command: list features in table format
- [x] 5.4 Implement `openepis bdd <feature>` command: display full BDD for a feature
- [x] 5.5 Implement `openepis context <file>` command: query file-to-BDD context

## 6. Verification

- [x] 6.1 Run `pnpm install` and verify workspace resolution for all internal dependencies
- [x] 6.2 Run `turbo build` and verify all packages and apps build successfully in correct order
- [x] 6.3 Verify TypeScript can resolve cross-package imports without errors
