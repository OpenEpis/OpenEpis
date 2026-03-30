import type { AgentMessage } from "@mariozechner/pi-agent-core";

const MAX_MESSAGES = 100;
const KEEP_RECENT = 40;

/**
 * Context pruning hook for Pi Agent's transformContext.
 * When the message history grows too large, removes older messages
 * while preserving the most recent ones for continuity.
 */
export async function transformContext(messages: AgentMessage[]): Promise<AgentMessage[]> {
  if (messages.length <= MAX_MESSAGES) {
    return messages;
  }

  // Keep only the most recent messages
  return messages.slice(-KEEP_RECENT);
}
