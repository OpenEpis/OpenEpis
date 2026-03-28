# OpenEpis API Design

Base URL: `/api`

All endpoints return JSON. Errors follow the format:

```json
{ "error": { "code": "NOT_FOUND", "message": "Project not found" } }
```

## Projects

### `POST /api/projects`

Create a new project.

```json
// Request
{ "name": "E-commerce Platform", "description": "Online shopping platform" }

// Response 201
{ "id": "uuid", "name": "...", "description": "...", "created_at": "..." }
```

### `GET /api/projects`

List all projects (for current user, when auth is implemented).

```json
// Response 200
{
  "projects": [{ "id": "uuid", "name": "...", "feature_count": 12, "created_at": "..." }]
}
```

### `GET /api/projects/:id`

Get project detail including repo count and feature count.

### `PUT /api/projects/:id`

Update project metadata.

### `DELETE /api/projects/:id`

Delete project and all associated data.

---

## Repositories

### `POST /api/projects/:projectId/repositories`

Link a code repository to a project.

```json
// Request
{
  "name": "frontend",
  "git_url": "https://github.com/acme/shop-web.git",
  "default_branch": "main",
  "access_token": "ghp_xxxx"
}

// Response 201
{ "id": "uuid", "name": "frontend", "git_url": "...", ... }
```

Note: `access_token` is stored encrypted, never returned in responses.

### `GET /api/projects/:projectId/repositories`

List repositories for a project.

### `DELETE /api/repositories/:id`

Remove a repository link.

---

## Features (BDD)

### `GET /api/projects/:projectId/features`

List all Features in a project.

```json
// Response 200
{
  "features": [
    {
      "id": "uuid",
      "title": "User Authentication",
      "description": "Login, registration, password recovery",
      "status": "active",
      "version": 3,
      "scenario_count": 8,
      "tags": ["core", "auth"],
      "updated_at": "..."
    }
  ]
}
```

Query params:

- `status` — filter by status (draft / active / deprecated)
- `tag` — filter by tag
- `search` — full-text search in title and description

### `GET /api/features/:id`

Get Feature with all Scenarios.

```json
// Response 200
{
  "id": "uuid",
  "title": "User Authentication",
  "description": "...",
  "status": "active",
  "version": 3,
  "scenarios": [
    {
      "id": "uuid",
      "title": "Successful login with email and password",
      "steps": [
        { "type": "given", "text": "the user is on the login page" },
        { "type": "when", "text": "the user enters valid email and password" },
        { "type": "and", "text": "the user clicks the login button" },
        { "type": "then", "text": "the user is redirected to the dashboard" }
      ],
      "tags": ["happy-path"]
    }
  ],
  "tags": ["core", "auth"],
  "updated_at": "..."
}
```

### `POST /api/projects/:projectId/features`

Create a new Feature.

```json
// Request
{
  "title": "Product Favorites",
  "description": "Users can save products for later",
  "scenarios": [
    {
      "title": "Favorite a product",
      "steps": [
        { "type": "given", "text": "the user is logged in" },
        { "type": "when", "text": "the user clicks the favorite button" },
        { "type": "then", "text": "the product is marked as favorited" }
      ]
    }
  ]
}
```

### `PUT /api/features/:id`

Update a Feature. Creates a revision automatically.

```json
// Request (partial update)
{
  "title": "Product Favorites",
  "description": "Updated description...",
  "scenarios": [...]
}

// Response 200
{ "id": "uuid", "version": 4, ... }
```

### `GET /api/features/:id/revisions`

Get revision history for a Feature.

```json
// Response 200
{
  "revisions": [
    {
      "version": 3,
      "change_summary": "Added scenario for delisted products",
      "changed_by": { "id": "uuid", "name": "Alice" },
      "created_at": "2026-03-28T10:00:00Z"
    },
    {
      "version": 2,
      "change_summary": "Updated favorite limit rule",
      "changed_by": { "id": "uuid", "name": "Alice" },
      "created_at": "2026-03-25T14:30:00Z"
    }
  ]
}
```

### `GET /api/features/:id/revisions/:version`

Get a specific historical snapshot.

---

## Context (Developer-facing)

### `POST /api/projects/:projectId/context`

Find BDD Features related to a source file. Used by Claude Code Skill.

```json
// Request
{
  "file_path": "src/pages/ProductDetail.tsx",
  "repository": "frontend"
}

// Response 200
{
  "related_features": [
    {
      "id": "uuid",
      "title": "Product Management",
      "relevance": "high",
      "related_scenarios": ["View product detail", "Product image gallery"]
    },
    {
      "id": "uuid",
      "title": "Product Favorites",
      "relevance": "medium",
      "related_scenarios": ["Favorite a product", "Unfavorite a product"]
    }
  ]
}
```

This endpoint may use LLM to match file content against Feature descriptions, or use a pre-built mapping from BDD initialization.

---

## BDD Initialization

### `POST /api/projects/:projectId/init`

Trigger BDD generation from code repositories. Returns immediately with task ID.

```json
// Request (optional: specify which repos, default all)
{ "repository_ids": ["uuid1", "uuid2"] }

// Response 202
{ "task_id": "uuid", "status": "queued" }
```

---

## Async Tasks

### `GET /api/tasks/:id`

Check status of an async task.

```json
// Response 200
{
  "id": "uuid",
  "type": "init_bdd",
  "status": "running",
  "progress": 45,
  "created_at": "..."
}
```

### `GET /api/tasks/:id` (when completed)

```json
{
  "id": "uuid",
  "type": "init_bdd",
  "status": "completed",
  "progress": 100,
  "result": {
    "features_generated": 12,
    "scenarios_generated": 47,
    "repositories_analyzed": 2
  }
}
```

---

## PRD Documents (MVP-1)

### `POST /api/projects/:projectId/prd`

### `GET /api/projects/:projectId/prd`

### `GET /api/prd/:id`

### `PUT /api/prd/:id`

Standard CRUD. Deferred to MVP-1.

## Conversations (MVP-1)

### `POST /api/prd/:prdId/conversations`

Start a conversational BDD generation session.

### `POST /api/conversations/:id/messages`

Send a message in the conversation (PM's reply). Returns AI's next response (streamed).

### `GET /api/conversations/:id`

Get full conversation history.

### `POST /api/conversations/:id/accept`

Accept the generated BDD changes, saving them to the database.

Deferred to MVP-1.
