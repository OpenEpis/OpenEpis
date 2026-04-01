## Context

OpenEpis's BDD agent generates BDD Features/Scenarios via LLM. Existing e2e tests verify structural correctness and SSE flow but cannot evaluate semantic quality. We need an independent eval framework using the LLM-as-Judge pattern to quantitatively score the agent's semantic capabilities.

Existing infrastructure:

- Playwright e2e framework (`tests/e2e/`) with api fixture and SSE parser
- LLM config provided via `LLM_CONFIG_*` environment variables in `.env.test`
- Agent interacts through conversation SSE endpoint, returning text-delta, bdd-change, and done events

## Goals / Non-Goals

**Goals:**

- Quantitatively evaluate the agent across four dimensions: conflict detection, intent classification, output relevance, BDD quality
- Provide a repeatable predefined scenario dataset
- Output a human-readable console scoring report
- Reuse existing Playwright infrastructure, minimize new code
- Intent classification uses both tool_calls hard assertions and LLM soft evaluation

**Non-Goals:**

- Not a CI gate (does not block merges)
- No historical trend tracking (no result persistence for now)
- No separate judge model (uses the same model)
- No modifications to existing application code or agent behavior

## Decisions

### 1. Reuse same model as Judge

**Choice**: Judge calls use the same LLM config as the agent.

**Rationale**: Reduces configuration complexity, works out of the box. Self-confirmation bias from same-model evaluation is acceptable at this stage — we're evaluating "did the agent do it" rather than "how well did the agent do it", which the same model can reliably judge.

**Alternative**: Use a cheaper model (e.g., Haiku) for judging. Deferred as future optimization.

### 2. Judge calls LLM API directly, not through agent pipeline

**Choice**: Judge module calls the LLM API directly via HTTP (OpenAI-compatible format), bypassing the BDD agent and conversation endpoint.

**Rationale**: Judge is pure evaluation logic — it doesn't need the agent's tools or system prompt. Direct API calls are simpler, faster, and more controllable. Reads the same `LLM_CONFIG_*` config from `.env.test`.

### 3. Static scenario data definitions

**Choice**: All eval scenarios are statically defined as TypeScript objects in `scenarios.ts`.

**Rationale**: Limited number of scenarios (~8 initially), no need for external data files or dynamic generation. TypeScript provides type safety and IDE support when editing scenarios.

### 4. Three-tier scoring bands

**Choice**:

- `>= 0.7` → PASS (✓)
- `0.4 ~ 0.7` → WARN (△)
- `< 0.4` → FAIL (✗)

**Rationale**: Hard thresholds are too flaky. Three-tier bands accommodate the inherent fuzziness of LLM scoring — WARN level draws attention without creating noise.

### 5. Intent classification = tool_calls hard assertions + LLM soft evaluation

**Choice**: Intent classification scenarios first check tool_calls (deterministic), then use LLM to evaluate the reply content's reasonableness.

**Rationale**: tool_calls precisely determine whether the agent called the right tools (e.g., create scenario has `update_bdd`, query scenario does not). LLM evaluation supplements by judging whether the reply semantics are reasonable. Combined as an average score.

## Risks / Trade-offs

**[Cost] Doubled LLM calls** → Each scenario requires an agent call + a judge call. With ~8 initial scenarios, each eval run makes ~16 LLM calls. Acceptable since it's not run frequently in CI.

**[Instability] Non-deterministic LLM output** → Same scenario may score differently across runs. Mitigated by three-tier scoring bands; can add multi-run median later.

**[Speed] Long run time** → Estimated 5-10 minutes (each scenario includes agent interaction + judge scoring). Acceptable as a manually-triggered quality report.

**[Self-evaluation bias] Same model as judge** → May be more lenient toward its own output. Current scenario goals are specific enough (e.g., "did it mention the conflict?") to reduce bias impact. Can switch judge models later.
