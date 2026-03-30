import type { ConversationMessage } from "@openepis/types";
import type { AgentMessage } from "@mariozechner/pi-agent-core";

/**
 * Convert OpenEpis ConversationMessages to Pi AgentMessages.
 * Only converts user and assistant text messages — system messages
 * are handled via the system prompt, and tool messages are managed
 * by the Pi agent loop.
 */
export function toPiMessages(messages: ConversationMessage[]): AgentMessage[] {
  const result: AgentMessage[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      // System messages are handled via systemPrompt, skip
      continue;
    }

    if (msg.role === "user") {
      result.push({
        role: "user",
        content: msg.content,
        timestamp: new Date(msg.timestamp).getTime(),
      } as AgentMessage);
    } else if (msg.role === "assistant") {
      result.push({
        role: "assistant",
        content: [{ type: "text", text: msg.content }],
        api: "",
        provider: "",
        model: "",
        usage: {
          input: 0,
          output: 0,
          cacheRead: 0,
          cacheWrite: 0,
          totalTokens: 0,
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
        },
        stopReason: "stop",
        timestamp: new Date(msg.timestamp).getTime(),
      } as AgentMessage);
    }
  }

  return result;
}

/**
 * Extract the text content from Pi AgentMessages back to OpenEpis format.
 * Used after agent completion to persist new messages.
 */
export function fromPiMessages(messages: AgentMessage[]): ConversationMessage[] {
  const result: ConversationMessage[] = [];

  for (const msg of messages) {
    if (msg.role === "user") {
      const content =
        typeof msg.content === "string"
          ? msg.content
          : (msg.content as Array<{ type: string; text?: string }>)
              .filter((c) => c.type === "text")
              .map((c) => c.text ?? "")
              .join("");
      result.push({
        role: "user",
        content,
        timestamp: new Date(msg.timestamp).toISOString(),
      });
    } else if (msg.role === "assistant") {
      const textParts = (msg.content as Array<{ type: string; text?: string }>)
        .filter((c) => c.type === "text")
        .map((c) => c.text ?? "");
      if (textParts.length > 0) {
        result.push({
          role: "assistant",
          content: textParts.join(""),
          timestamp: new Date(msg.timestamp).toISOString(),
        });
      }
    }
    // Skip toolResult messages — they are internal to the agent loop
  }

  return result;
}
