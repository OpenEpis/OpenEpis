# Conversational BDD Generation (MVP-1 Design Notes)

This document captures the design thinking for the core differentiating feature: conversational PRD → BDD generation. Not in MVP-0 scope but documented here to inform architectural decisions.

## Flow

```
PM writes PRD
    │
    ▼
PM clicks [Generate BDD]
    │
    ▼
System builds AI context:
    ├─ The PRD content
    ├─ Layer 1: Feature index (all titles + one-line summaries, always loaded)
    ├─ Layer 2: Related Feature details (AI picks which to load in full)
    └─ Layer 3: On-demand (AI requests more context mid-conversation)
    │
    ▼
AI analyzes and asks clarifying questions
    │
    ▼
Multi-turn conversation (PM answers, AI digs deeper)
    │
    ▼
AI proposes BDD changes:
    ├─ New Features to create
    ├─ Existing Features to modify
    └─ Each change individually reviewable
    │
    ▼
PM reviews each proposed change:
    ├─ Accept → saved to database
    ├─ Edit → modify then save
    └─ Reject → discarded
```

## Context Management Strategy

BDD corpus grows over time. Can't fit everything in one LLM context window.

### Three-layer context loading

**Layer 1 — Feature Index (always loaded)**

```
All Features with title + one-line description.
12 Features, ~50 tokens each = ~600 tokens. Scales to hundreds of Features.
```

**Layer 2 — Related Features (loaded at conversation start)**

```
AI reads PRD + index, identifies which Features are relevant.
Those Features loaded in full (all Scenarios + steps).
Typically 3-8 Features, ~500 tokens each = ~2000-4000 tokens.
```

**Layer 3 — On-demand (loaded mid-conversation)**

```
During conversation, AI may realize it needs more context.
"I need to check the payment system BDD before answering..."
Dynamically loaded when needed.
```

## AI Behavior Guidelines

The AI should:

- **Ask before assuming**: If the PRD doesn't specify something, ask the PM
- **Reference existing BDD**: "Your current BDD for user auth requires email verification. Should favoriting also require a verified email?"
- **Surface conflicts**: "This PRD says free users can favorite 10 items, but existing BDD has no concept of user tiers"
- **Propose cross-cutting changes**: "Adding this feature means we should also update the Personal Center Feature"
- **Batch questions when possible**: Ask 2-3 related questions at once, not one at a time
- **Know when to stop**: After 2-3 rounds, propose the BDD. Don't ask indefinitely.

## Proposed BDD Changes Format

When AI finishes the conversation, it produces structured changes:

```json
{
  "new_features": [
    {
      "title": "Product Favorites",
      "description": "Users can save products for later viewing",
      "scenarios": [
        {
          "title": "Favorite a product",
          "steps": [
            { "type": "given", "text": "the user is logged in" },
            { "type": "when", "text": "..." },
            { "type": "then", "text": "..." }
          ]
        }
      ]
    }
  ],
  "modified_features": [
    {
      "feature_id": "uuid-of-product-management",
      "reason": "Add 'delisted' product status",
      "added_scenarios": [...],
      "modified_scenarios": [
        { "scenario_id": "uuid", "new_steps": [...] }
      ]
    }
  ]
}
```

This structured output enables the Web UI to show each change individually for PM review.

## Web UI Layout Concept

```
┌──────────────────────────────────────────────────────────┐
│  OpenEpis — Project Name — PRD: Feature Title            │
├──────────────┬───────────────────────────────────────────┤
│              │                                           │
│  PRD Editor  │  AI Conversation                         │
│  (left)      │  (right)                                 │
│              │                                           │
│  Markdown    │  Multi-turn chat                         │
│  editor for  │  between PM and AI                       │
│  PRD content │                                           │
│              │                                           │
│              │                                           │
│              │                                           │
├──────────────┴───────────────────────────────────────────┤
│  BDD Changes Preview (bottom, appears after generation)  │
│                                                          │
│  [+] New: Product Favorites (5 scenarios)  [Accept][Edit]│
│  [~] Mod: Product Management (+1 scenario) [Accept][Edit]│
│  [~] Mod: Personal Center (+1 scenario)    [Accept][Edit]│
└──────────────────────────────────────────────────────────┘
```
