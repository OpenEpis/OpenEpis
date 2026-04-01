## ADDED Requirements

### Requirement: Eval scenario data structure

Each eval scenario SHALL contain the following fields:

- `name`: Scenario name (used in report display)
- `dimension`: Evaluation dimension (`conflict` | `classification` | `relevance` | `quality`)
- `setup`: Optional preset data (`existingFeatures` array)
- `input`: User message sent to the agent (string or string array for multi-turn)
- `goal`: Natural language description of the evaluation objective, provided to the LLM Judge
- `hardAssertions`: Optional deterministic assertions (checking tool_calls)

#### Scenario: Type-safe scenario definitions

- **WHEN** defining an eval scenario
- **THEN** TypeScript types SHALL enforce that `name`, `dimension`, `input`, and `goal` fields are present

### Requirement: Conflict detection scenario set

The system SHALL include at least 2 conflict detection scenarios:

**Scenario A — Policy contradiction**: Existing feature "User Login" contains a "Lock account after three failed password attempts" scenario. User input: "Write BDD for user login with no restrictions on failed attempts". Goal: agent should mention in its reply that the new requirement contradicts the existing "three failures lock" scenario.

**Scenario B — Duplicate feature**: Existing feature "Shopping Cart" contains an "Add item to cart" scenario. User input: "Write BDD for shopping cart functionality". Goal: agent should recognize the existing feature with the same name and ask whether to modify or create new, rather than ignoring existing content.

#### Scenario: Conflict scenario A is executable

- **WHEN** executing the policy contradiction scenario
- **THEN** the system creates the preset feature, sends the user message, collects agent reply, and calls the judge for scoring

#### Scenario: Conflict scenario B is executable

- **WHEN** executing the duplicate feature scenario
- **THEN** the system creates the preset feature, sends the user message, collects agent reply, and calls the judge for scoring

### Requirement: Intent classification scenario set

The system SHALL include at least 3 intent classification scenarios:

**Scenario A — Create intent**: No preset features. Input: "Write BDD for user favorites functionality". Goal: agent should generate new features. Hard assertion: tool_calls contains `update_bdd`, bdd_output contains `new_features`.

**Scenario B — Modify intent**: Preset feature "Shopping Cart". Input: "Add a scenario to shopping cart: notify user when quantity exceeds stock". Goal: agent should search for the existing cart feature and modify it. Hard assertion: tool_calls contains `search_features` or `get_feature_detail`.

**Scenario C — Query intent**: Several preset features. Input: "What features does the project currently have?". Goal: agent should search and list existing features without generating new BDD. Hard assertion: tool_calls does not contain `update_bdd`.

#### Scenario: Intent classification with hard assertions + soft evaluation

- **WHEN** executing an intent classification scenario
- **THEN** the system first checks hardAssertions (tool_calls), then calls the LLM judge to evaluate reply semantics, with the final score being the average of both

### Requirement: Output relevance scenario

The system SHALL include at least 1 output relevance scenario:

**Scenario**: Input: "Write BDD for payment functionality". Goal: all generated feature/scenario titles and content should be related to the "payment" topic and should not drift to unrelated functionality.

#### Scenario: Relevance scoring

- **WHEN** executing the relevance scenario
- **THEN** the judge evaluates whether each feature in the BDD output is related to the input topic and returns a composite score

### Requirement: BDD quality scenario

The system SHALL include at least 1 BDD quality scenario:

**Scenario**: After generating BDD on any topic, evaluate step specificity. Goal: Given/When/Then steps should be specific and testable, should not contain vague expressions like "works correctly" or "handles properly"; should cover both happy path and error paths.

#### Scenario: Quality scoring

- **WHEN** executing the BDD quality scenario
- **THEN** the judge evaluates step specificity and scenario coverage, and returns a score
