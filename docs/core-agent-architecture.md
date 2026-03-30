# Core Agent Architecture

## Overview

`@openepis/core` is the BDD generation engine — an agent workflow that takes conversation context, autonomously reasons about BDD, and produces structured changes. It is built on [pi-agent-core](https://github.com/badlogic/pi-mono/tree/main/packages/agent) and [pi-ai](https://github.com/badlogic/pi-mono/tree/main/packages/ai).

The agent can:

- Autonomously judge whether it has enough context
- Ask clarifying questions before generating BDD
- Fetch additional Feature details on demand (via tool)
- Search existing Features for relevance (via tool)
- Propose BDD changes (new/modified Features) via tool
- Self-check and revise its own output across multiple LLM steps

## Positioning in the Monorepo

```
apps/server        ← HTTP layer, DB persistence, SSE streaming
  │
  ├─ reads DB → builds AgentInput
  ├─ injects IBddContextService (adapter over storage)
  ├─ calls createBddAgent()
  ├─ subscribes to Agent events → SSE to client
  └─ on agent_end: persists messages + pending_changes
  │
packages/core      ← Agent workflow engine (this package)
  │
  ├─ prompt assembly (three-layer context)
  ├─ tool definitions (get_feature_detail, search_features, update_bdd)
  ├─ change accumulation logic (mergeChanges)
  └─ Pi Agent loop (multi-step LLM + tool execution)
  │
packages/storage   ← Data access interfaces (unchanged)
packages/storage-pg← PostgreSQL implementation (unchanged)
packages/types     ← Shared domain types (unchanged)

🗑️ packages/llm    ← REMOVED — replaced by pi-ai
```

## Why Pi Agent Core (not Vercel AI SDK)

The previous `@openepis/llm` used Vercel AI SDK (`ai` package) for `generateText` / `generateObject`. For the agent workflow, we evaluated both options:

| Capability                   | Vercel AI SDK (`streamText` + `stopWhen`) | Pi Agent Core (`Agent` class)                                                                      |
| ---------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Multi-step tool loop         | ✅ `stopWhen: stepCountIs(N)`             | ✅ Built-in agent loop                                                                             |
| Stateful agent               | ❌ Developer manages messages             | ✅ `Agent.state.messages`                                                                          |
| Structured events            | ❌ Flat `fullStream` chunks               | ✅ `agent_start` → `turn_start` → `message_update` → `tool_execution_*` → `turn_end` → `agent_end` |
| Context management           | ❌ Manual                                 | ✅ `transformContext` hook                                                                         |
| Tool execution control       | ❌ Auto-execute only                      | ✅ `beforeToolCall` / `afterToolCall` hooks                                                        |
| Mid-run steering             | ❌ None                                   | ✅ `steer()` / `followUp()`                                                                        |
| Side channel for tool events | ❌ Need custom impl                       | ✅ `subscribe()` gives all events                                                                  |

**Decision**: Use `pi-agent-core` for the agent loop and `pi-ai` for LLM abstraction. This eliminates the need for custom agent loop code and the side-channel pattern that Vercel AI SDK would require for `update_bdd` event propagation.

**Reference**: [OpenClaw's Pi integration](https://docs.openclaw.ai/pi) demonstrates embedding `pi-agent-core` into a product — same pattern we follow here, but at a lower level (we use `pi-agent-core` directly, not `pi-coding-agent`).

## Package Dependencies

```json
{
  "@mariozechner/pi-agent-core": "^0.61.0",
  "@mariozechner/pi-ai": "^0.61.0",
  "@openepis/types": "workspace:*"
}
```

Does **not** depend on:

- `@mariozechner/pi-coding-agent` (no coding capabilities needed)
- `@openepis/storage` (read access injected via `IBddContextService`)
- `@ai-sdk/anthropic` / `@ai-sdk/openai` (pi-ai handles providers)
- `zod` (pi uses TypeBox for tool schemas)

## Architecture

```
┌─ apps/server ──────────────────────────────────────────────────┐
│                                                                 │
│  POST /api/conversations/:id/messages                           │
│                                                                 │
│  1. DB read: conversation, messages, project                    │
│  2. DB read: llm_configs → provider/model/apiKey                │
│  3. DB read: features (index + related)                         │
│  4. Create adapter: new BddContextServiceImpl(storage)          │
│  5. Create agent:                                               │
│     ┌──────────────────────────────────────────────────────┐    │
│     │ createBddAgent({                                     │    │
│     │   project, featureIndex, relatedFeatures,            │    │
│     │   prdContent, messages, pendingChanges,              │    │
│     │   model: { provider, modelId, apiKey },              │    │
│     │   contextService: adapter,         ← DI injection    │    │
│     │ })                                                   │    │
│     └──────────────────────────────────────────────────────┘    │
│  6. agent.subscribe(event => SSE to client)                     │
│  7. await agent.prompt(userMessage)                             │
│  8. On agent_end: persist messages + pending_changes to DB      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─ @openepis/core ───────────────────────────────────────────────┐
│                                                                 │
│  createBddAgent(options)                                        │
│    │                                                            │
│    ├─ buildSystemPrompt(options)                                │
│    │    ├─ Layer 1: Feature index (all titles + descriptions)   │
│    │    ├─ Layer 2: Related Feature details (preloaded)         │
│    │    ├─ PRD content (if attached)                            │
│    │    └─ BDD formatting instructions                         │
│    │                                                            │
│    ├─ createTools(contextService)                               │
│    │    ├─ get_feature_detail  → contextService.getFeatureDetail │
│    │    ├─ search_features     → contextService.searchFeatures  │
│    │    └─ update_bdd          → pure logic (no storage)        │
│    │                                                            │
│    └─ new Agent({                                               │
│         initialState: { systemPrompt, model, tools, messages }, │
│         transformContext: pruneIfNeeded,                         │
│       })                                                        │
│                                                                 │
│  Pi Agent Loop (automatic):                                     │
│    LLM call → tool calls → execute → LLM → ... → done          │
│                                                                 │
│  Events emitted via agent.subscribe():                          │
│    message_update  → text streaming                             │
│    tool_execution_end (update_bdd) → BDD changes                │
│    agent_end → conversation complete                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Agent Loop Detail

The Pi Agent manages the multi-step loop. A typical conversation turn:

```
User: "做收藏功能，最多100个，必须登录"

Step 1: LLM reasons
  → calls search_features("收藏")
  → Pi executes tool → returns matching Features
  → Pi feeds result back to LLM

Step 2: LLM continues reasoning
  → calls get_feature_detail("feature-xxx")  (found a related Feature)
  → Pi executes tool → returns full Feature detail
  → Pi feeds result back to LLM

Step 3: LLM has enough context
  → calls update_bdd({
      new_features: [{ title: "商品收藏", scenarios: [...] }],
      modified_features: [{ feature_id: "feature-xxx", ... }]
    })
  → Pi executes tool → returns confirmation
  → Pi feeds result back to LLM

Step 4: LLM generates final text response
  → "我已经生成了收藏功能的 BDD，包含3个场景..."
  → No more tool calls → Agent loop ends
```

Maximum steps: 10 (configurable). Typical BDD generation uses 3-6 steps.

## Dependency Injection: IBddContextService

`core` defines what it needs (port). `server` implements it (adapter).

### Interface (defined in core)

```typescript
// packages/core/src/types.ts

import type { BddStep } from "@openepis/types";

/** Feature summary — for search results and Layer 1 index */
export interface FeatureSummary {
  id: string;
  title: string;
  description: string;
  tags: string[];
  scenarioCount: number;
}

/** Feature full detail — for Layer 2/3 context and get_feature_detail */
export interface FeatureDetail {
  id: string;
  title: string;
  description: string;
  tags: string[];
  scenarios: Array<{
    id: string;
    title: string;
    steps: BddStep[];
    tags: string[];
  }>;
}

/** The read-only context service that core needs from outside */
export interface IBddContextService {
  /** Get Feature with all Scenarios by ID */
  getFeatureDetail(featureId: string): Promise<FeatureDetail | null>;

  /** Search Features by keyword within a project */
  searchFeatures(projectId: string, query: string): Promise<FeatureSummary[]>;
}
```

### Adapter (implemented in server)

```typescript
// apps/server/src/services/bdd-context-service.ts

import type { IBddContextService, FeatureDetail, FeatureSummary } from "@openepis/core";
import type { IStorageService } from "@openepis/storage";

export class BddContextServiceImpl implements IBddContextService {
  constructor(private storage: IStorageService) {}

  async getFeatureDetail(featureId: string): Promise<FeatureDetail | null> {
    const feature = await this.storage.features.findById(featureId);
    if (!feature) return null;
    const scenarios = await this.storage.scenarios.findByFeature(featureId);
    return {
      id: feature.id,
      title: feature.title,
      description: feature.description,
      tags: feature.tags,
      scenarios: scenarios.map((s) => ({
        id: s.id,
        title: s.title,
        steps: s.steps,
        tags: s.tags,
      })),
    };
  }

  async searchFeatures(projectId: string, query: string): Promise<FeatureSummary[]> {
    const features = await this.storage.features.findByProject(projectId);
    const q = query.toLowerCase();
    const matched = features.filter(
      (f) => f.title.toLowerCase().includes(q) || f.description.toLowerCase().includes(q),
    );
    const results: FeatureSummary[] = [];
    for (const f of matched) {
      const scenarios = await this.storage.scenarios.findByFeature(f.id);
      results.push({
        id: f.id,
        title: f.title,
        description: f.description,
        tags: f.tags,
        scenarioCount: scenarios.length,
      });
    }
    return results;
  }
}
```

### Dependency direction

```
  core defines:    IBddContextService, FeatureDetail, FeatureSummary
       ▲
       │ implements
       │
  server provides: BddContextServiceImpl (wraps IStorageService)
       │
       ▼ uses
  storage:         IStorageService → features, scenarios
```

core never imports from `@openepis/storage`. The dependency is inverted.

## Tools

### get_feature_detail

**Purpose**: On-demand context loading (Layer 3). When the agent realizes it needs more information about an existing Feature.

**Input**: `{ featureId: string }`
**Output**: `FeatureDetail` (full Feature with Scenarios)
**Side effects**: None (read-only)
**Backed by**: `IBddContextService.getFeatureDetail()`

### search_features

**Purpose**: Let the agent discover relevant existing Features by keyword instead of guessing IDs.

**Input**: `{ query: string }`
**Output**: `FeatureSummary[]` (matching Features with basic info)
**Side effects**: None (read-only)
**Backed by**: `IBddContextService.searchFeatures()`

### update_bdd

**Purpose**: Propose BDD changes (new Features, modified Features). This is the agent's primary output mechanism.

**Input**: Structured BDD changes (see schema in [conversational-bdd.md](./conversational-bdd.md#ai-tool-update_bdd))
**Output**: Confirmation summary returned to the LLM (e.g., "Recorded: 2 new features, 1 modified feature")
**Side effects**: None — changes are proposed, not applied. Server captures them via Pi's `tool_execution_end` event.
**Backed by**: Pure logic (no service call needed)

The agent can call `update_bdd` multiple times within a single conversation turn. Each call's output is captured by the server and merged using `mergeChanges()`.

## Change Accumulation

BDD changes accumulate across conversation turns. The merge logic lives in `core` as a pure function:

```typescript
// packages/core/src/changes.ts
export function mergeChanges(
  existing: GeneratedChanges | null,
  incoming: GeneratedChanges,
): GeneratedChanges;
```

Merge rules:

- **New feature with same title**: incoming replaces existing (updated proposal)
- **New feature with new title**: appended
- **Modified feature with same feature_id**: incoming modifications merged into existing
- **Modified feature with new feature_id**: appended

Server calls `mergeChanges()` when it receives an `update_bdd` tool result via Pi events:

```typescript
agent.subscribe((event) => {
  if (event.type === "tool_execution_end" && event.toolName === "update_bdd") {
    conversation.pendingChanges = mergeChanges(conversation.pendingChanges, event.result);
  }
});
```

## Three-Layer Context Assembly

System prompt is built by `buildSystemPrompt()` using three layers of context:

```
Layer 1 — Feature Index (always loaded)
  All Features: title + one-line description.
  ~50 tokens each. Scales to hundreds.
  Source: BddAgentOptions.featureIndex (preloaded by server)

Layer 2 — Related Features (loaded at conversation start)
  Server pre-identifies relevant Features and loads full details.
  Typically 3-8 Features, ~500 tokens each.
  Source: BddAgentOptions.relatedFeatures (preloaded by server)

Layer 3 — On-demand (loaded during agent execution)
  Agent discovers it needs more context → calls get_feature_detail tool.
  Fetched via IBddContextService (injected).
  Tool results automatically become part of the LLM conversation context.
```

Additionally, if a PRD document is attached, its content is included in the system prompt as background context.

## Event Flow: Server ↔ Agent ↔ Client

```
Client (Web UI)          Server (Fastify)              Core (Pi Agent)
─────────────────        ────────────────              ──────────────
POST /messages
  { content }
─────────────────►
                         Build AgentInput from DB
                         Create agent
                         agent.subscribe(handler)
                         agent.prompt(content)
                                                       ───────────────►
                                                       agent_start
                                                       turn_start
                                                       message_start
                                                       ┌─ LLM streaming ─┐
                         ◄── message_update ───────────│  text delta      │
SSE: text-delta  ◄───────                              │                  │
                         ◄── message_update ───────────│  text delta      │
SSE: text-delta  ◄───────                              └──────────────────┘
                                                       tool_execution_start
                                                         (search_features)
                                                       tool_execution_end
                                                       ┌─ LLM continues ──┐
                         ◄── message_update ───────────│  more text        │
SSE: text-delta  ◄───────                              └──────────────────┘
                                                       tool_execution_start
                                                         (update_bdd)
                                                       tool_execution_end
                         ◄── tool_execution_end ───────  { changes }
                         mergeChanges(pending, changes)
SSE: bdd-change  ◄───────
                                                       ┌─ LLM final text ─┐
                         ◄── message_update ───────────│  "已生成BDD..."    │
SSE: text-delta  ◄───────                              └──────────────────┘
                                                       turn_end
                                                       agent_end
                         ◄── agent_end ────────────────  { messages }
                         Persist to DB
SSE: done        ◄───────
```

## Package Structure

```
packages/core/
├── src/
│   ├── index.ts                   # Public API: createBddAgent, mergeChanges, types
│   ├── agent.ts                   # createBddAgent() implementation
│   ├── changes.ts                 # mergeChanges() — change accumulation logic
│   ├── prompt/
│   │   ├── system-prompt.ts       # buildSystemPrompt() — three-layer context
│   │   └── templates.ts           # Prompt templates (role, BDD format, instructions)
│   ├── tools/
│   │   ├── index.ts               # createTools() — assemble all tools
│   │   ├── schemas.ts             # TypeBox schemas for tool parameters
│   │   ├── get-feature-detail.ts  # get_feature_detail tool definition
│   │   ├── search-features.ts     # search_features tool definition
│   │   └── update-bdd.ts          # update_bdd tool definition
│   ├── context/
│   │   ├── transform.ts           # transformContext — context pruning hook
│   │   └── convert.ts             # Message format conversion (OpenEpis ↔ Pi)
│   └── types.ts                   # All exported types
├── package.json
└── tsconfig.json
```

## Migration: Removing @openepis/llm

`@openepis/llm` (Vercel AI SDK wrapper) is replaced by `pi-ai` within `@openepis/core`.

### What changes

| Before                                                 | After            |
| ------------------------------------------------------ | ---------------- |
| `@openepis/llm` package exists                         | Deleted          |
| `ILlmService` interface (generateText, generateObject) | Removed          |
| `AiSdkLlmService` class                                | Removed          |
| `Container` has `TOKENS.LlmService`                    | Removed          |
| `server/index.ts` imports and registers LlmService     | Removed          |
| Zod used for LLM schemas                               | TypeBox (via Pi) |

### What stays

| Item                                  | Status                                            |
| ------------------------------------- | ------------------------------------------------- |
| `llm_configs` DB table                | Kept — stores provider/model/apiKey configuration |
| `ILlmConfigStorage` interface         | Kept — server reads config to pass to core        |
| `LlmConfig` type in `@openepis/types` | Kept                                              |

The `llm_configs` table now feeds `core` indirectly: server reads config → passes `{ provider, modelId, apiKey }` to `createBddAgent()` → core uses `pi-ai`'s `getModel()` internally.
