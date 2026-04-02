import type { ConversationMessage } from "@openepis/types";

/** Extract plain text from a ConversationMessage's ContentBlock[] content. */
export function getTextContent(message: ConversationMessage): string {
  return message.content
    .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("");
}
