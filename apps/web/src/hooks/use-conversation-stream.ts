import { useState, useCallback, useRef } from "react";
import type { GeneratedChanges, ConversationMessage } from "@openepis/types";

interface UseConversationStreamOptions {
  conversationId: string;
  onDone?: () => void;
}

interface UseConversationStreamReturn {
  messages: ConversationMessage[];
  pendingChanges: GeneratedChanges | null;
  isStreaming: boolean;
  streamingText: string;
  sendMessage: (content: string) => void;
  abort: () => void;
  setMessages: React.Dispatch<React.SetStateAction<ConversationMessage[]>>;
  setPendingChanges: React.Dispatch<React.SetStateAction<GeneratedChanges | null>>;
}

export function useConversationStream({
  conversationId,
  onDone,
}: UseConversationStreamOptions): UseConversationStreamReturn {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [pendingChanges, setPendingChanges] = useState<GeneratedChanges | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      if (isStreaming) return;

      const userMessage: ConversationMessage = {
        role: "user",
        content: [{ type: "text", text: content }],
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setStreamingText("");
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const baseUrl = import.meta.env.VITE_API_URL || "";
      let accumulatedText = "";

      fetch(`${baseUrl}/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ content }),
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok || !response.body) {
            setIsStreaming(false);
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            let eventType = "";
            let dataStr = "";

            for (const line of lines) {
              if (line.startsWith("event: ")) {
                eventType = line.slice(7).trim();
              } else if (line.startsWith("data: ")) {
                dataStr = line.slice(6);
              } else if (line === "" && eventType && dataStr) {
                try {
                  const data = JSON.parse(dataStr);

                  if (eventType === "text-delta") {
                    accumulatedText += data.delta;
                    setStreamingText(accumulatedText);
                  } else if (eventType === "bdd-change") {
                    setPendingChanges(data.changes);
                  } else if (eventType === "done") {
                    const assistantMessage: ConversationMessage = {
                      role: "assistant",
                      content: [{ type: "text", text: accumulatedText }],
                      timestamp: new Date().toISOString(),
                    };
                    setMessages((prev) => [...prev, assistantMessage]);
                    setStreamingText("");
                    setIsStreaming(false);
                    onDone?.();
                  } else if (eventType === "error") {
                    setIsStreaming(false);
                  }
                } catch {
                  // ignore parse errors
                }
                eventType = "";
                dataStr = "";
              }
            }
          }

          // If stream ended without a done event
          if (isStreaming) {
            if (accumulatedText) {
              const assistantMessage: ConversationMessage = {
                role: "assistant",
                content: [{ type: "text", text: accumulatedText }],
                timestamp: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, assistantMessage]);
              setStreamingText("");
            }
            setIsStreaming(false);
          }
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            console.error("Stream error:", err);
          }
          // Keep partial text as a message if we have any
          if (accumulatedText) {
            const assistantMessage: ConversationMessage = {
              role: "assistant",
              content: [{ type: "text", text: accumulatedText }],
              timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setStreamingText("");
          }
          setIsStreaming(false);
        });
    },
    [conversationId, isStreaming, onDone],
  );

  return {
    messages,
    pendingChanges,
    isStreaming,
    streamingText,
    sendMessage,
    abort,
    setMessages,
    setPendingChanges,
  };
}
