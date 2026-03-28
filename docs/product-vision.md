# OpenEpis Product Vision

## What is OpenEpis?

OpenEpis is a platform for PM-Developer collaboration, where **BDD (Behavior-Driven Development) documents serve as the single source of truth** between product requirements and engineering implementation.

## Core Positioning

- PM writes PRD, the system generates structured BDD through interactive conversation
- Developers read BDD through API / Claude Code Skill to guide development
- Code generation is NOT OpenEpis's responsibility — that's the Agent's job
- OpenEpis owns the **requirements side**, not the implementation side

## Target Users

| Role      | How they use OpenEpis                                          | Access          |
| --------- | -------------------------------------------------------------- | --------------- |
| PM        | Web UI: write PRD, review/edit BDD, conversational Q&A with AI | Read/Write BDD  |
| Developer | Claude Code Skill / API: read BDD for development context      | Read-only BDD   |
| Admin     | Project setup, repo configuration, LLM settings                | Platform config |

## Core Features

### Feature A: Conversational PRD-to-BDD Generation (PM-facing)

PM writes a PRD in the web UI, then initiates BDD generation. The AI:

1. Analyzes the PRD against all existing BDD in the project
2. Identifies gaps, ambiguities, and potential conflicts
3. Asks clarifying questions in a multi-turn conversation
4. Generates BDD drafts (may include new Features + modifications to existing ones)
5. PM reviews, edits, and confirms

### Feature B: BDD API + Claude Code Skill (Developer-facing)

OpenEpis exposes a REST API for reading BDD. A thin Claude Code Skill layer wraps this API for a natural developer experience:

```
/openepis features          — list all Features in the project
/openepis bdd <feature>     — view full BDD for a Feature
/openepis context <file>    — find BDD related to a source file
```

### Feature C: Codebase-to-BDD Initialization (System)

When a project is first set up, OpenEpis can analyze the configured code repositories and auto-generate an initial set of BDD documents. This gives PM a starting point rather than a blank slate.

Process: clone repos (shallow) → analyze code structure → generate BDD → PM reviews → cleanup cloned code.

## Design Principles

- **BDD is PM-owned**: only PMs can modify BDD. Developers and testers are read-only.
- **BDD lives in the database**: not in Git. This enables structured editing, versioning, access control, and cross-repo features.
- **BDD granularity**: enough for an Agent to develop against, but not so detailed that it becomes code design. Describes behaviors and boundaries, not technical implementation.
- **Platform product**: OpenEpis manages other projects' requirements, not just its own.
- **Self-bootstrapping goal**: OpenEpis should eventually be able to use itself to manage its own development.

## Self-bootstrapping Strategy

```
Phase 0: Use OpenSpec + Claude Code to build OpenEpis MVP
Phase 1: MVP ready → migrate OpenEpis's own requirements into OpenEpis
Phase 2: Use OpenEpis to continue developing OpenEpis
```
