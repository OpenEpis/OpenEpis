## 1. LLM Judge Module

- [x] 1.1 Create `tests/e2e/eval/judge.ts`: define `JudgeResult` type (score + reasoning), implement LLM config loading (from `LLM_CONFIG_*` env vars)
- [x] 1.2 Implement judge prompt template (with goal, agent_reply, tool_calls, bdd_output placeholders), require LLM to return JSON
- [x] 1.3 Implement `llmJudge()` function: assemble prompt, call LLM API (OpenAI-compatible format), parse returned JSON score/reasoning, gracefully degrade to score=0 on errors

## 2. Scenario Data Definitions

- [x] 2.1 Create `tests/e2e/eval/scenarios.ts`: define `EvalScenario` type (name, dimension, setup, input, goal, hardAssertions)
- [x] 2.2 Implement conflict detection scenario A (policy contradiction: three-strike lock vs no restriction) and scenario B (duplicate feature: existing cart + new cart request)
- [x] 2.3 Implement intent classification scenarios A (create), B (modify), C (query), with their respective hardAssertions definitions
- [x] 2.4 Implement output relevance scenario (payment topic matching) and BDD quality scenario (step specificity evaluation)

## 3. Eval Execution and Reporting

- [x] 3.1 Create `tests/e2e/eval/eval.spec.ts`: reuse api fixture and parseSSEStream, implement scenario execution engine (create resources → send message → collect output → cleanup)
- [x] 3.2 Implement agent output collection: extract text from text-delta SSE events, extract tool_calls and pending_changes from conversation detail
- [x] 3.3 Implement hard assertion checks (expectToolCalled / expectToolNotCalled), average with judge score
- [x] 3.4 Implement console report output: header, one row per scenario (name + dimension + score + status marker), summary row (average score + status counts + threshold legend)

## 4. Integration and Run Configuration

- [x] 4.1 Add `eval` script in root `package.json`, pointing to `playwright test tests/e2e/eval/`
- [x] 4.2 End-to-end verification: run `pnpm eval`, confirm all scenarios execute and report outputs correctly
