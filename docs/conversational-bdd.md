# Conversational BDD Generation

## Overview

The core feature of OpenEpis: PM starts a conversation with AI to generate and evolve BDD. The conversation is the primary interface — PRD and BDD are both byproducts of the dialogue, not prerequisites.

## Design Principles

- **Chat-first**: conversation drives everything. No mandatory PRD-before-BDD flow.
- **Implicit generation**: AI judges when it has enough information to generate BDD — no explicit "generate" button.
- **Progressive updates**: BDD evolves across conversation turns. AI can update/extend BDD at any point.
- **PM stays in control**: BDD changes are proposed, not applied. PM reviews and applies when ready.

## UI Layout

Two-panel layout: left = conversation, right = BDD preview.

```
┌─────────────────────────┬────────────────────────────────────────┐
│                         │                                        │
│  Chat                   │  BDD Preview                           │
│                         │                                        │
│  PM: 我们要加收藏功能    │  ┌─ 商品收藏 (新) ──────────────────┐ │
│  [📎 收藏PRD.md]        │  │                                  │ │
│                         │  │  Scenario: 登录用户收藏商品       │ │
│  AI: 有几个问题...      │  │    Given 用户已登录               │ │
│      1. 收藏上限？      │  │    When  用户点击收藏按钮         │ │
│      2. ...             │  │    Then  商品出现在收藏列表中     │ │
│                         │  │                                  │ │
│  PM: 最多 100 个        │  │  Scenario: 未登录用户收藏         │ │
│                         │  │    ...                            │ │
│  AI: 明白。已更新 BDD。  │  └──────────────────────────────────┘ │
│                         │                                        │
│                         │  ┌─ 个人中心 (已修改) ──────────────┐ │
│                         │  │                                  │ │
│                         │  │  Scenario: 查看收藏列表 (新增)    │ │
│                         │  │    ...                            │ │
│                         │  │                                  │ │
│                         │  │  (其他未修改 scenario 折叠/灰显)   │ │
│                         │  └──────────────────────────────────┘ │
│                         │                                        │
│  [消息输入] [📎] [发送]  │               [全部应用] [放弃变更]   │
└─────────────────────────┴────────────────────────────────────────┘
```

### Right panel behavior

- Only shows **affected** Features (new + modified), not the entire BDD corpus.
- New Features clearly marked as "新".
- Modified Features show which Scenarios are new/changed; unchanged Scenarios are collapsed or grayed out.
- Panel updates progressively as AI generates changes across conversation turns.
- PM clicks "全部应用" to write all changes to the database, or "放弃变更" to discard.

## Conversation Flow Example

```
Turn 1   PM: "做收藏功能" (可选: 附件上传 PRD 文档)
Turn 2   AI: "有几个问题：收藏上限？未登录怎么办？"
Turn 3   PM: "100个，必须登录"
Turn 4   AI: "好的" ──────────────────────► 右侧出现: 商品收藏 (3 scenarios)
Turn 5   PM: "对了，还要支持收藏夹分组"
Turn 6   AI: "分组是必须的还是可选？"
Turn 7   PM: "可选的，默认有一个'全部'分组"
Turn 8   AI: "明白" ──────────────────────► 右侧更新: 商品收藏 (5 scenarios)
                                            新增: 收藏夹分组 (3 scenarios)
Turn 9   PM: "看起来不错" → 点击 [全部应用] → 写入 DB
```

Key behaviors:

- AI asks clarifying questions before generating (implicit judgment).
- BDD generation happens mid-conversation, not at the end.
- PM can continue chatting after BDD appears — further turns can add/modify BDD.
- PM applies changes when satisfied, not per-turn.

## Streaming & Tool Calling

AI output is streamed via SSE. BDD changes are delivered through Vercel AI SDK's tool calling mechanism.

```
┌──────────────────────────────────────────────────┐
│  AI's response stream                             │
│                                                   │
│  Text: "明白了，登录用户最多收藏 100 个商品，      │
│        未登录提示登录。我已经生成了 BDD。"         │
│                                                   │
│  Tool Call: update_bdd({                          │
│    new_features: [{                               │
│      title: "商品收藏",                            │
│      scenarios: [...]                             │
│    }],                                            │
│    modified_features: [{                          │
│      feature_id: "xxx",                           │
│      reason: "添加收藏入口",                       │
│      added_scenarios: [...]                       │
│    }]                                             │
│  })                                               │
└──────────────────────────────────────────────────┘
         │                     │
         ▼                     ▼
   Left panel:            Right panel:
   text streams in        BDD preview updates
```

### Stream protocol

```
Client                             Server

  POST /api/conversations/:id/messages
  { content, attachments? }
  ──────────────────────────────►
                                   Assemble context (3-layer)
                                   Call LLM with streamText + tools
  SSE: text delta
  ◄──────────────────────────────
  SSE: text delta
  ◄──────────────────────────────
  SSE: tool_call (update_bdd)
  ◄──────────────────────────────   BDD changes as structured data
  SSE: text delta (after tool)
  ◄──────────────────────────────
  SSE: [DONE]
  ◄──────────────────────────────
```

Frontend behavior:

- Text deltas → append to chat (left panel, typewriter effect).
- `update_bdd` tool call → parse changes, merge into right panel state.
- Multiple tool calls per response are allowed (AI might update BDD, then continue talking, then update again).

## AI Tool: `update_bdd`

This is the tool definition given to the LLM. When AI decides BDD changes are needed, it calls this tool.

```typescript
{
  name: "update_bdd",
  description: "Propose BDD changes based on the conversation. Call this when you have enough information to generate or update BDD Features and Scenarios.",
  parameters: {
    new_features: [{
      title: string,
      description: string,
      scenarios: [{
        title: string,
        steps: [{ type: "given" | "when" | "then" | "and" | "but", text: string }],
        tags?: string[]
      }],
      tags?: string[]
    }],
    modified_features: [{
      feature_id: string,
      reason: string,
      updated_title?: string,
      updated_description?: string,
      added_scenarios?: [{ title, steps, tags? }],
      modified_scenarios?: [{
        scenario_id: string,
        updated_title?: string,
        updated_steps?: [{ type, text }]
      }],
      removed_scenario_ids?: string[]
    }]
  }
}
```

### Accumulation logic

Right panel state accumulates across turns:

- Turn 4: `update_bdd` → state = { new: [Feature A] }
- Turn 8: `update_bdd` → state = { new: [Feature A (updated), Feature B], modified: [Feature C] }

The server stores accumulated changes on the `Conversation` record (`pending_changes` field). Each `update_bdd` call merges into the existing state — a new feature with the same title replaces the old proposal, new modifications merge with existing ones.

## Context Assembly (Three-Layer)

When building the LLM prompt, context is loaded in layers to stay within token limits.

```
Layer 1 — Feature Index (always loaded)
  All Features: title + one-line description.
  ~50 tokens each. Scales to hundreds.

Layer 2 — Related Features (loaded at conversation start)
  AI reads the initial message + index → identifies relevant Features.
  Those Features loaded in full (all Scenarios + steps).
  Typically 3-8 Features, ~500 tokens each.

Layer 3 — On-demand (loaded mid-conversation)
  AI realizes it needs more context → fetches additional Features.
  Implemented via a read-only tool: get_feature_detail(feature_id).
```

### System prompt structure

```
You are a BDD generation assistant for project "{project_name}".

## Existing BDD Index
{layer 1: all feature titles + descriptions}

## Related BDD Details
{layer 2: full feature details for relevant features}

## Instructions
- Ask clarifying questions before generating BDD. Batch 2-3 questions.
- When you have enough information, call update_bdd to propose changes.
- Reference existing BDD when relevant.
- Surface conflicts between new requirements and existing BDD.
- You can call get_feature_detail to load more context if needed.
- BDD should describe behaviors and boundaries, not technical implementation.
```

## Data Model Changes

### Conversation — decouple from PRD

Current: `prd_id NOT NULL` references `prd_documents`.

Change: `prd_id` becomes nullable. Conversation is a project-level entity. PRD is optional context, not a prerequisite.

```sql
ALTER TABLE conversations ALTER COLUMN prd_id DROP NOT NULL;
```

### ConversationMessage — support attachments

```typescript
interface ConversationMessage {
  role: "system" | "assistant" | "user";
  content: string;
  timestamp: string;
  attachments?: Array<{
    // NEW
    filename: string;
    content_type: string;
    url: string; // stored file URL or inline content
  }>;
  tool_calls?: Array<{
    // NEW: record AI's tool calls
    name: string;
    arguments: Record<string, unknown>;
  }>;
}
```

### GeneratedChanges — make it precise

Replace the current simplified type with a structure that supports granular operations:

```typescript
interface GeneratedChanges {
  new_features: Array<{
    temp_id: string; // client-side tracking
    title: string;
    description: string;
    scenarios: Array<{
      title: string;
      steps: BddStep[];
      tags?: string[];
    }>;
    tags?: string[];
  }>;
  modified_features: Array<{
    feature_id: string;
    reason: string;
    updated_title?: string;
    updated_description?: string;
    added_scenarios?: Array<{
      title: string;
      steps: BddStep[];
      tags?: string[];
    }>;
    modified_scenarios?: Array<{
      scenario_id: string;
      updated_title?: string;
      updated_steps?: BddStep[];
    }>;
    removed_scenario_ids?: string[];
  }>;
}
```

### Conversation — add pending_changes field

```typescript
interface Conversation {
  id: string;
  prd_id: string | null; // nullable now
  project_id: string;
  messages: ConversationMessage[];
  status: "active" | "completed" | "cancelled";
  pending_changes: GeneratedChanges | null; // renamed from generated_changes
  created_at: string;
  updated_at: string;
}
```

## API Design

### Conversation CRUD

```
POST   /api/projects/:id/conversations          Create conversation
GET    /api/projects/:id/conversations          List conversations
GET    /api/conversations/:id                    Get conversation (messages + pending_changes)
DELETE /api/conversations/:id                    Delete conversation
```

### Send message (streaming)

```
POST /api/conversations/:id/messages
Content-Type: application/json
→ { "content": "做收藏功能", "attachments?": [...] }

Response: text/event-stream (SSE)
← data: {"type":"text-delta","delta":"有几个"}
← data: {"type":"text-delta","delta":"问题..."}
← data: {"type":"tool-call","name":"update_bdd","arguments":{...}}
← data: {"type":"done","message_id":"..."}
```

Server-side:

1. Append user message to conversation.
2. Assemble context (3-layer).
3. Call `streamText` with tools (`update_bdd`, `get_feature_detail`).
4. Stream text deltas and tool calls to client.
5. On `update_bdd` tool call: merge changes into `conversation.pending_changes`.
6. Append complete assistant message (with tool_calls) to conversation.

### Apply changes

```
POST /api/conversations/:id/apply
→ {}

Behavior:
- Read conversation.pending_changes
- For each new_feature: create Feature + Scenarios + Revision
- For each modified_feature: update Feature, add/modify/remove Scenarios, create Revision
- Clear pending_changes, set conversation status = "completed"
- Return { applied_features: [...] }
```

### Discard changes

```
POST /api/conversations/:id/discard
→ {}

Behavior:
- Clear pending_changes
- Optionally set conversation status = "cancelled"
```

## File Upload

PM can attach files (PRD documents, specs, images) to messages.

Upload flow:

1. Client uploads file to `POST /api/uploads` → returns `{ url, filename, content_type }`.
2. Client includes attachment metadata in the message body.
3. Server reads file content when assembling LLM context (text files are inlined, images sent as vision input).

For MVP, store uploads on local filesystem or a simple blob store. File content extraction (PDF, docx, etc.) can be added incrementally.

## Implementation Order

```
Phase 1: Data model + API skeleton
  - Update types (ConversationMessage, GeneratedChanges, Conversation)
  - Update DB schema (conversations.prd_id nullable, pending_changes column)
  - Add conversation CRUD routes
  - Run migration

Phase 2: BDD generation service
  - Context assembly (3-layer loading)
  - System prompt design
  - Tool definitions (update_bdd, get_feature_detail)
  - LLM orchestration with streamText
  - Change accumulation logic

Phase 3: Streaming endpoint
  - POST /api/conversations/:id/messages with SSE response
  - Message persistence (user + assistant)
  - Tool call execution and pending_changes update

Phase 4: Apply/discard
  - POST /api/conversations/:id/apply
  - POST /api/conversations/:id/discard
  - Feature + Scenario creation/modification with revisions

Phase 5: Web UI
  - Two-panel layout (chat + BDD preview)
  - Streaming message rendering
  - BDD preview panel with change highlighting
  - File upload
  - Apply/discard controls

Phase 6: Polish
  - File content extraction (PDF, docx)
  - Conversation history / resume
  - Error handling and edge cases
```
