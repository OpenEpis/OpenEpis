import { config } from "dotenv";

config({ path: ".env.test" });

// --- Types ---

export interface JudgeResult {
  score: number;
  reasoning: string;
}

// --- Config ---

interface LlmConfig {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl?: string;
}

function loadLlmConfig(): LlmConfig {
  const provider = process.env.LLM_CONFIG_PROVIDER;
  const model = process.env.LLM_CONFIG_MODEL;
  const apiKey = process.env.LLM_CONFIG_API_KEY;
  const baseUrl = process.env.LLM_CONFIG_BASE_URL;

  if (!provider) throw new Error("Missing required env var: LLM_CONFIG_PROVIDER");
  if (!model) throw new Error("Missing required env var: LLM_CONFIG_MODEL");
  if (!apiKey) throw new Error("Missing required env var: LLM_CONFIG_API_KEY");

  return { provider, model, apiKey, baseUrl };
}

// --- Prompt Template ---

function buildJudgePrompt(params: {
  goal: string;
  agentReply: string;
  toolCalls: string;
  bddOutput: string;
}): string {
  return `You are an evaluation judge. Score how well an AI agent fulfilled a given goal.

## Goal
${params.goal}

## Agent Reply
${params.agentReply}

## Tool Calls
${params.toolCalls}

## BDD Output
${params.bddOutput}

## Instructions
Evaluate how well the agent's output satisfies the goal. Consider:
1. Whether the agent addressed the core requirement described in the goal
2. Whether the tool calls and BDD output are appropriate
3. Whether the reply is relevant and helpful

Return your evaluation as JSON with exactly this format:
{"score": <number between 0.0 and 1.0>, "reasoning": "<brief explanation>"}

Return ONLY the JSON object, no other text.`;
}

// --- Judge Function ---

export async function llmJudge(params: {
  goal: string;
  agentReply: string;
  toolCalls: unknown[];
  bddOutput: unknown;
}): Promise<JudgeResult> {
  const cfg = loadLlmConfig();

  const prompt = buildJudgePrompt({
    goal: params.goal,
    agentReply: params.agentReply,
    toolCalls: JSON.stringify(params.toolCalls, null, 2),
    bddOutput: JSON.stringify(params.bddOutput, null, 2),
  });

  const baseUrl = cfg.baseUrl ?? "https://api.anthropic.com";
  const url = `${baseUrl}/v1/chat/completions`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 512,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { score: 0, reasoning: `Judge API error: ${res.status} ${text}` };
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = data.choices?.[0]?.message?.content ?? "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { score: 0, reasoning: `Judge parse error: no JSON found in response: ${content}` };
    }

    const parsed = JSON.parse(jsonMatch[0]) as { score?: number; reasoning?: string };

    if (typeof parsed.score !== "number" || typeof parsed.reasoning !== "string") {
      return {
        score: 0,
        reasoning: `Judge parse error: invalid shape: ${JSON.stringify(parsed)}`,
      };
    }

    return {
      score: Math.max(0, Math.min(1, parsed.score)),
      reasoning: parsed.reasoning,
    };
  } catch (err) {
    return {
      score: 0,
      reasoning: `Judge parse error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
