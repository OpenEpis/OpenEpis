# OpenEpis Data Model

## Overview

PostgreSQL database. All tables use UUID primary keys and have `created_at` / `updated_at` timestamps.

BDD versioning strategy: every modification creates a revision record. The main table always reflects current state; the revisions table preserves full history.

## Entity Relationship

```
users ──────┐
            │ N:M
            ▼
       project_members
            │
            ▼
projects ──────┬──── repositories
               │
               ├──── features ──── scenarios
               │        │
               │        └──── feature_revisions
               │
               ├──── prd_documents ──── conversations
               │
               ├──── async_tasks
               │
               └──── llm_configs
```

## Tables

### users

User accounts. Auth implementation deferred, but table designed for future auth.

| Column     | Type         | Notes    |
| ---------- | ------------ | -------- |
| id         | uuid         | PK       |
| email      | varchar(255) | unique   |
| name       | varchar(255) |          |
| avatar_url | text         | nullable |
| created_at | timestamptz  |          |
| updated_at | timestamptz  |          |

### projects

Top-level organizational unit.

| Column      | Type         | Notes      |
| ----------- | ------------ | ---------- |
| id          | uuid         | PK         |
| name        | varchar(255) |            |
| description | text         | nullable   |
| created_by  | uuid         | FK → users |
| created_at  | timestamptz  |            |
| updated_at  | timestamptz  |            |

### project_members

| Column     | Type        | Notes                   |
| ---------- | ----------- | ----------------------- |
| id         | uuid        | PK                      |
| project_id | uuid        | FK → projects           |
| user_id    | uuid        | FK → users              |
| role       | varchar(20) | 'pm' / 'dev' / 'viewer' |
| created_at | timestamptz |                         |

Unique constraint: (project_id, user_id)

### repositories

Code repositories linked to a project. A project can have multiple repos (e.g., frontend, backend, mobile).

| Column                | Type         | Notes                                 |
| --------------------- | ------------ | ------------------------------------- |
| id                    | uuid         | PK                                    |
| project_id            | uuid         | FK → projects                         |
| name                  | varchar(255) | display name, e.g. "frontend"         |
| git_url               | text         | clone URL                             |
| default_branch        | varchar(255) | default: "main"                       |
| credentials_encrypted | text         | nullable, encrypted access token      |
| last_synced_at        | timestamptz  | nullable, last time code was analyzed |
| created_at            | timestamptz  |                                       |
| updated_at            | timestamptz  |                                       |

### features

BDD Features. Current state — always reflects the latest version.

| Column      | Type         | Notes                                 |
| ----------- | ------------ | ------------------------------------- |
| id          | uuid         | PK                                    |
| project_id  | uuid         | FK → projects                         |
| title       | varchar(500) | Feature title                         |
| description | text         | Feature-level description             |
| status      | varchar(20)  | 'draft' / 'active' / 'deprecated'     |
| version     | integer      | incremented on each edit, starts at 1 |
| tags        | text[]       | PostgreSQL array                      |
| sort_order  | integer      | for display ordering                  |
| created_by  | uuid         | FK → users                            |
| created_at  | timestamptz  |                                       |
| updated_at  | timestamptz  |                                       |

### scenarios

BDD Scenarios belonging to a Feature.

| Column     | Type         | Notes                   |
| ---------- | ------------ | ----------------------- |
| id         | uuid         | PK                      |
| feature_id | uuid         | FK → features (CASCADE) |
| title      | varchar(500) | Scenario title          |
| steps      | jsonb        | array of { type, text } |
| tags       | text[]       |                         |
| sort_order | integer      |                         |
| created_at | timestamptz  |                         |
| updated_at | timestamptz  |                         |

**steps JSONB structure**:

```json
[
  { "type": "given", "text": "the user is logged in" },
  { "type": "and", "text": "the user is on the product detail page" },
  { "type": "when", "text": "the user clicks the favorite button" },
  { "type": "then", "text": "the product is marked as favorited" },
  { "type": "and", "text": "the favorite button changes to active state" }
]
```

### feature_revisions

Full history of Feature changes. Every edit to a Feature or its Scenarios creates a snapshot here.

| Column         | Type        | Notes                                      |
| -------------- | ----------- | ------------------------------------------ |
| id             | uuid        | PK                                         |
| feature_id     | uuid        | FK → features                              |
| version        | integer     | matches the version at time of save        |
| snapshot       | jsonb       | full Feature + Scenarios snapshot          |
| change_summary | text        | human-readable description of what changed |
| changed_by     | uuid        | FK → users                                 |
| created_at     | timestamptz |                                            |

**snapshot JSONB structure**:

```json
{
  "title": "Product Favorites",
  "description": "Users can favorite products...",
  "status": "active",
  "scenarios": [
    {
      "title": "Favorite a product",
      "steps": [...],
      "tags": ["happy-path"]
    }
  ]
}
```

### prd_documents

PRD documents written by PMs.

| Column     | Type         | Notes                               |
| ---------- | ------------ | ----------------------------------- |
| id         | uuid         | PK                                  |
| project_id | uuid         | FK → projects                       |
| title      | varchar(500) |                                     |
| content    | text         | Markdown content                    |
| status     | varchar(20)  | 'draft' / 'in_review' / 'completed' |
| created_by | uuid         | FK → users                          |
| created_at | timestamptz  |                                     |
| updated_at | timestamptz  |                                     |

### conversations

Multi-turn conversations for PRD → BDD generation.

| Column            | Type        | Notes                                |
| ----------------- | ----------- | ------------------------------------ |
| id                | uuid        | PK                                   |
| prd_id            | uuid        | FK → prd_documents                   |
| project_id        | uuid        | FK → projects                        |
| messages          | jsonb       | array of conversation messages       |
| status            | varchar(20) | 'active' / 'completed' / 'cancelled' |
| generated_changes | jsonb       | nullable, proposed BDD changes       |
| created_at        | timestamptz |                                      |
| updated_at        | timestamptz |                                      |

**messages JSONB structure**:

```json
[
  { "role": "system", "content": "...", "timestamp": "..." },
  { "role": "assistant", "content": "I have a few questions...", "timestamp": "..." },
  { "role": "user", "content": "Yes, login is required", "timestamp": "..." }
]
```

**generated_changes JSONB structure**:

```json
{
  "new_features": [
    { "title": "Product Favorites", "scenarios": [...] }
  ],
  "modified_features": [
    { "feature_id": "uuid", "changes": "Added 'delisted' status scenario" }
  ]
}
```

### async_tasks

Tracks long-running operations (BDD initialization, large BDD generation).

| Column     | Type        | Notes                                         |
| ---------- | ----------- | --------------------------------------------- |
| id         | uuid        | PK                                            |
| project_id | uuid        | FK → projects                                 |
| type       | varchar(50) | 'init_bdd' / 'generate_bdd'                   |
| status     | varchar(20) | 'queued' / 'running' / 'completed' / 'failed' |
| progress   | integer     | 0-100                                         |
| result     | jsonb       | nullable, task output                         |
| error      | text        | nullable                                      |
| created_by | uuid        | FK → users                                    |
| created_at | timestamptz |                                               |
| updated_at | timestamptz |                                               |

### llm_configs

LLM provider configuration. MVP: platform-level only.

| Column            | Type         | Notes                                     |
| ----------------- | ------------ | ----------------------------------------- |
| id                | uuid         | PK                                        |
| scope             | varchar(20)  | 'platform' / 'project'                    |
| scope_id          | uuid         | nullable, project_id if scope=project     |
| provider          | varchar(50)  | 'claude' / 'openai' / 'ollama'            |
| model             | varchar(100) | e.g. 'claude-sonnet-4-6'                  |
| api_key_encrypted | text         | nullable (not needed for Ollama)          |
| base_url          | text         | nullable (for Ollama or custom endpoints) |
| is_active         | boolean      | default true                              |
| created_at        | timestamptz  |                                           |
| updated_at        | timestamptz  |                                           |

## Indexes

```sql
-- Features by project
CREATE INDEX idx_features_project ON features(project_id);

-- Scenarios by feature
CREATE INDEX idx_scenarios_feature ON scenarios(feature_id);

-- Feature revisions by feature + version
CREATE INDEX idx_feature_revisions_feature ON feature_revisions(feature_id, version DESC);

-- PRD by project
CREATE INDEX idx_prd_project ON prd_documents(project_id);

-- Conversations by PRD
CREATE INDEX idx_conversations_prd ON conversations(prd_id);

-- Async tasks by project + status
CREATE INDEX idx_async_tasks_project_status ON async_tasks(project_id, status);

-- Project members lookup
CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_project_members_project ON project_members(project_id);
```
