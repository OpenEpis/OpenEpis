import type { ContentBlock, ConversationMessage } from "@openepis/types";
import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  TextContent,
  ImageContent,
  ThinkingContent,
  ToolCall,
} from "@mariozechner/pi-ai";

/**
 * Convert OpenEpis ConversationMessages to Pi AgentMessages.
 * Block-to-block mapping — lossless for text, image, tool_use, tool_result, thinking.
 * System messages are skipped (handled via systemPrompt).
 */
export function toPiMessages(messages: ConversationMessage[]): AgentMessage[] {
  const result: AgentMessage[] = [];

  for (const msg of messages) {
    if (msg.role === "system") continue;

    const ts = new Date(msg.timestamp).getTime();

    if (msg.role === "user") {
      const piContent: (TextContent | ImageContent)[] = [];
      for (const block of msg.content) {
        if (block.type === "text") {
          piContent.push({ type: "text", text: block.text });
        } else if (block.type === "image") {
          piContent.push({ type: "image", data: block.data, mimeType: block.mimeType });
        }
      }
      result.push({
        role: "user",
        content:
          piContent.length === 1 && piContent[0].type === "text" ? piContent[0].text : piContent,
        timestamp: ts,
      } as UserMessage);
    } else if (msg.role === "assistant") {
      const piContent: (TextContent | ThinkingContent | ToolCall)[] = [];
      for (const block of msg.content) {
        if (block.type === "text") {
          piContent.push({ type: "text", text: block.text });
        } else if (block.type === "thinking") {
          piContent.push({ type: "thinking", thinking: block.thinking });
        } else if (block.type === "tool_use") {
          piContent.push({
            type: "toolCall",
            id: block.id,
            name: block.name,
            arguments: block.arguments,
          });
        }
      }
      result.push({
        role: "assistant",
        content: piContent,
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
        timestamp: ts,
      } as AssistantMessage);
    } else if (msg.role === "tool_result") {
      // Find the tool_result content block
      const trBlock = msg.content.find((b) => b.type === "tool_result");
      if (trBlock && trBlock.type === "tool_result") {
        result.push({
          role: "toolResult",
          toolCallId: trBlock.tool_use_id,
          toolName: "",
          content: [{ type: "text", text: trBlock.content }],
          isError: trBlock.is_error ?? false,
          timestamp: ts,
        } as ToolResultMessage);
      }
    }
  }

  return result;
}

/**
 * Convert Pi AgentMessages back to OpenEpis ConversationMessages.
 * Block-to-block mapping — preserves text, thinking, tool_use, tool_result, image.
 */
export function fromPiMessages(messages: AgentMessage[]): ConversationMessage[] {
  const result: ConversationMessage[] = [];

  for (const msg of messages) {
    if (msg.role === "user") {
      const userMsg = msg as UserMessage;
      const content: ContentBlock[] = [];
      if (typeof userMsg.content === "string") {
        content.push({ type: "text", text: userMsg.content });
      } else {
        for (const block of userMsg.content) {
          if (block.type === "text") {
            content.push({ type: "text", text: block.text });
          } else if (block.type === "image") {
            content.push({ type: "image", data: block.data, mimeType: block.mimeType });
          }
        }
      }
      result.push({
        role: "user",
        content,
        timestamp: new Date(userMsg.timestamp).toISOString(),
      });
    } else if (msg.role === "assistant") {
      const assistantMsg = msg as AssistantMessage;
      const content: ContentBlock[] = [];
      for (const block of assistantMsg.content) {
        if (block.type === "text") {
          content.push({ type: "text", text: block.text });
        } else if (block.type === "thinking") {
          content.push({ type: "thinking", thinking: block.thinking });
        } else if (block.type === "toolCall") {
          content.push({
            type: "tool_use",
            id: block.id,
            name: block.name,
            arguments: block.arguments,
          });
        }
      }
      if (content.length > 0) {
        result.push({
          role: "assistant",
          content,
          timestamp: new Date(assistantMsg.timestamp).toISOString(),
        });
      }
    } else if (msg.role === "toolResult") {
      const trMsg = msg as ToolResultMessage;
      const textContent = trMsg.content
        .filter((b): b is TextContent => b.type === "text")
        .map((b) => b.text)
        .join("");
      result.push({
        role: "tool_result",
        content: [
          {
            type: "tool_result",
            tool_use_id: trMsg.toolCallId,
            content: textContent,
            is_error: trMsg.isError || undefined,
          },
        ],
        timestamp: new Date(trMsg.timestamp).toISOString(),
      });
    }
  }

  return result;
}
