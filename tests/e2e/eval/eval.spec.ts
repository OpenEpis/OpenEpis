import {
  test,
  expect,
  createProject,
  deleteProject,
  createLlmConfig,
  deleteLlmConfig,
  hasLlmConfig,
  parseSSEStream,
  BASE_URL,
  type SSEEvent,
} from "../fixtures/data-fixtures.js";
import { llmJudge, type JudgeResult } from "./judge.js";
import { evalScenarios, type HardAssertions } from "./scenarios.js";

// --- Constants ---

const SCENARIO_TIMEOUT = 300_000;

// --- Score bands ---

function statusMarker(score: number): string {
  if (score >= 0.7) return "\u2713"; // ✓
  if (score >= 0.4) return "\u25B3"; // △
  return "\u2717"; // ✗
}

// --- Agent output collection ---

interface AgentOutput {
  text: string;
  toolCalls: Array<{ name: string; arguments?: unknown }>;
  bddOutput: unknown;
}

function collectAgentOutput(
  events: SSEEvent[],
  conversationDetail: {
    messages: Array<{
      role: string;
      content?: string;
      tool_calls?: Array<{ name: string; arguments?: unknown }>;
    }>;
    pending_changes: unknown;
  },
): AgentOutput {
  // Extract text from text-delta events
  const text = events
    .filter((e) => e.event === "text-delta")
    .map((e) => {
      const data = e.data as { delta?: string };
      return data.delta ?? "";
    })
    .join("");

  // Extract tool_calls from conversation detail messages
  const toolCalls: Array<{ name: string; arguments?: unknown }> = [];
  for (const msg of conversationDetail.messages) {
    if (msg.tool_calls) {
      toolCalls.push(...msg.tool_calls);
    }
  }

  // Extract bdd output (pending_changes)
  const bddOutput = conversationDetail.pending_changes;

  return { text, toolCalls, bddOutput };
}

// --- Hard assertions ---

function evaluateHardAssertions(
  assertions: HardAssertions,
  toolCalls: Array<{ name: string }>,
): number {
  const checks: boolean[] = [];

  if (assertions.expectToolCalled) {
    for (const tool of assertions.expectToolCalled) {
      checks.push(toolCalls.some((tc) => tc.name === tool));
    }
  }

  if (assertions.expectToolNotCalled) {
    for (const tool of assertions.expectToolNotCalled) {
      checks.push(!toolCalls.some((tc) => tc.name === tool));
    }
  }

  if (checks.length === 0) return 1;
  return checks.filter(Boolean).length / checks.length;
}

// --- Report ---

interface ScenarioResult {
  name: string;
  dimension: string;
  score: number;
  marker: string;
  reasoning: string;
}

function printReport(results: ScenarioResult[]) {
  const divider = "─".repeat(72);

  console.log("\n" + divider);
  console.log("  LLM Eval Report");
  console.log(divider);
  console.log(`  ${"Scenario".padEnd(28)} ${"Dimension".padEnd(16)} ${"Score".padEnd(8)} Status`);
  console.log("  " + "─".repeat(66));

  for (const r of results) {
    console.log(
      `  ${r.name.padEnd(28)} ${r.dimension.padEnd(16)} ${r.score.toFixed(2).padEnd(8)} ${r.marker}`,
    );
  }

  console.log("  " + "─".repeat(66));

  const avg = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const pass = results.filter((r) => r.score >= 0.7).length;
  const warn = results.filter((r) => r.score >= 0.4 && r.score < 0.7).length;
  const fail = results.filter((r) => r.score < 0.4).length;

  console.log(
    `  Average: ${avg.toFixed(2)}   ${"\u2713"} ${pass}  ${"\u25B3"} ${warn}  ${"\u2717"} ${fail}`,
  );
  console.log(`  Threshold: \u2713 >= 0.70   \u25B3 0.40-0.69   \u2717 < 0.40`);
  console.log(divider + "\n");
}

// --- Test Suite ---

test.describe("LLM Eval Suite", () => {
  test.skip(!hasLlmConfig, "LLM config not available — skipping eval suite");
  test.describe.configure({ mode: "serial" });

  const results: ScenarioResult[] = [];

  for (const scenario of evalScenarios) {
    test(`eval: ${scenario.name} (${scenario.dimension})`, async ({ api }) => {
      test.setTimeout(SCENARIO_TIMEOUT);

      const llmConfig = await createLlmConfig(api);
      const project = await createProject(api);

      try {
        // Setup: create existing features if needed
        if (scenario.setup?.existingFeatures) {
          for (const feature of scenario.setup.existingFeatures) {
            const res = await api.post(`/api/projects/${project.id}/features`, {
              data: feature,
            });
            expect(res.status()).toBe(201);
          }
        }

        // Create conversation
        const convRes = await api.post(`/api/projects/${project.id}/conversations`, {
          data: {},
        });
        expect(convRes.status()).toBe(201);
        const conv = await convRes.json();

        // Send message and collect SSE events
        const events = await parseSSEStream(BASE_URL, `/api/conversations/${conv.id}/messages`, {
          content: scenario.input,
        });

        // Get conversation detail for tool_calls and pending_changes
        const detailRes = await api.get(`/api/conversations/${conv.id}`);
        const detail = await detailRes.json();

        const output = collectAgentOutput(events, detail);

        // Evaluate
        let finalScore: number;
        let judgeResult: JudgeResult;

        if (scenario.hardAssertions) {
          const hardScore = evaluateHardAssertions(scenario.hardAssertions, output.toolCalls);
          judgeResult = await llmJudge({
            goal: scenario.goal,
            agentReply: output.text,
            toolCalls: output.toolCalls,
            bddOutput: output.bddOutput,
          });
          finalScore = (hardScore + judgeResult.score) / 2;
        } else {
          judgeResult = await llmJudge({
            goal: scenario.goal,
            agentReply: output.text,
            toolCalls: output.toolCalls,
            bddOutput: output.bddOutput,
          });
          finalScore = judgeResult.score;
        }

        const result: ScenarioResult = {
          name: scenario.name,
          dimension: scenario.dimension,
          score: finalScore,
          marker: statusMarker(finalScore),
          reasoning: judgeResult.reasoning,
        };
        results.push(result);

        console.log(
          `  [${result.marker}] ${result.name} (${result.dimension}): ${result.score.toFixed(2)} — ${result.reasoning}`,
        );
      } finally {
        await deleteProject(api, project.id);
        await deleteLlmConfig(api, llmConfig.id);
      }
    });
  }

  test.afterAll(() => {
    if (results.length > 0) {
      printReport(results);
    }
  });
});
