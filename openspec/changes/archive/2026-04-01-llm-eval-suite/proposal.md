## Why

Existing e2e tests only verify structural correctness of BDD agent output (field presence, type validity) but cannot verify semantic quality — whether output is relevant to input, whether conflicts are detected, or whether user intent is correctly understood. An independent LLM-as-Judge eval suite will provide quantitative scoring of the agent's semantic capabilities, serving as a quality report rather than a CI gate.

## What Changes

- Add `tests/e2e/eval/` directory with an independent eval framework
- Add LLM Judge module: reuses existing LLM config, calls the same model to score agent output
- Add predefined eval scenario dataset covering four dimensions: conflict detection, intent classification, output relevance, BDD quality
- Add `pnpm eval` script, runs independently from CI, outputs scoring report to console
- Reuse existing Playwright infrastructure (api fixture, parseSSEStream)

## Capabilities

### New Capabilities

- `llm-judge`: LLM judge module that receives agent input/output, calls LLM to score against a goal description, returns 0-1 score and reasoning
- `eval-scenarios`: Predefined eval scenario dataset containing setup (existing features), input (user messages), goal (evaluation objective description)
- `eval-runner`: Eval execution and report output, iterates scenarios calling agent + judge, aggregates scores into a console report

### Modified Capabilities

(No existing specs need modification — the eval suite is purely additive test infrastructure)

## Impact

- **New files**: 3 files under `tests/e2e/eval/` (judge.ts, scenarios.ts, eval.spec.ts)
- **package.json**: New `eval` script
- **Dependencies**: None — reuses existing Playwright + LLM config
- **Existing code**: Zero changes — eval suite is fully independent
