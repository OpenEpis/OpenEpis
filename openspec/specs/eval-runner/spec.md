## ADDED Requirements

### Requirement: Scenario execution engine

The system SHALL iterate over all predefined scenarios and execute the following flow:

1. Create LLM config and project (via API)
2. If the scenario has `setup.existingFeatures`, create preset features
3. Create a conversation
4. Send `input` message to the conversation SSE endpoint
5. Collect agent reply (text, tool_calls, bdd_output)
6. Execute hardAssertions (if any)
7. Call LLM Judge for scoring
8. Clean up created resources

#### Scenario: Normal execution of a single scenario

- **WHEN** executing a scenario containing setup, input, and goal
- **THEN** the system completes all steps in the flow and returns a score with reasoning

#### Scenario: Agent call timeout

- **WHEN** the agent SSE stream does not complete within the timeout period
- **THEN** the scenario is marked with score=0, reasoning records the timeout, and execution continues to the next scenario

### Requirement: Hard assertion execution

When a scenario defines `hardAssertions`, the system SHALL check whether tool_calls satisfy the conditions:

- `expectToolCalled`: Expects a specific tool to have been called (existence check)
- `expectToolNotCalled`: Expects a specific tool to not have been called

Hard assertion results are 0 (not satisfied) or 1 (satisfied), averaged with the LLM judge score for the final score.

#### Scenario: Hard assertion passes

- **WHEN** a scenario requires `expectToolCalled: "update_bdd"` and the agent did call `update_bdd`
- **THEN** the hard assertion score is 1.0

#### Scenario: Hard assertion fails

- **WHEN** a scenario requires `expectToolNotCalled: "update_bdd"` but the agent did call `update_bdd`
- **THEN** the hard assertion score is 0.0

### Requirement: Console report output

After all scenarios are executed, the system SHALL output a formatted console report containing:

- Each scenario's name, dimension, score, and status marker
- Status marker rules: `>= 0.7` shows ✓, `0.4 ~ 0.7` shows △, `< 0.4` shows ✗
- Summary row at the bottom: overall average score, count per status
- Threshold legend

#### Scenario: Report format is correct

- **WHEN** all scenarios have finished executing
- **THEN** console output contains a header, one row per scenario, and a summary row with scores to two decimal places

#### Scenario: Partial failure does not block

- **WHEN** a scenario fails to execute (e.g., agent timeout or judge parse error)
- **THEN** that scenario shows its corresponding score, remaining scenarios continue executing, and the report outputs completely

### Requirement: Independent run script

The system SHALL be triggered via the `pnpm eval` command, which runs Playwright tests targeting the `tests/e2e/eval/` directory.

Prerequisites are the same as existing LLM e2e tests: `LLM_CONFIG_*` variables configured in `.env.test` and the server running at `localhost:3001`.

#### Scenario: pnpm eval is runnable

- **WHEN** the user executes `pnpm eval`
- **THEN** Playwright runs the test files under `tests/e2e/eval/` and outputs the scoring report
