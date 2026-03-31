import { useEffect, useRef, useState, type FormEvent } from "react";
import { useParams } from "react-router";
import { Send, Square, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useConversation, useApplyChanges, useDiscardChanges } from "@/hooks/use-conversations";
import { useConversationStream } from "@/hooks/use-conversation-stream";
import { cn } from "@/lib/utils";
import type { BddStep } from "@openepis/types";

export function ConversationDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data: conversation, isLoading } = useConversation(id!);
  const applyChanges = useApplyChanges();
  const discardChanges = useDiscardChanges();
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  const {
    messages,
    pendingChanges,
    isStreaming,
    streamingText,
    sendMessage,
    abort,
    setMessages,
    setPendingChanges,
  } = useConversationStream({
    conversationId: id!,
    onDone: () => {
      // Refresh on done could be done here
    },
  });

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize from loaded conversation
  useEffect(() => {
    if (conversation) {
      setMessages(conversation.messages);
      setPendingChanges(conversation.pending_changes);
    }
  }, [conversation, setMessages, setPendingChanges]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    sendMessage(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  }

  function handleApply() {
    applyChanges.mutate(id!, {
      onSuccess: () => {
        setPendingChanges(null);
      },
    });
  }

  function handleDiscard() {
    discardChanges.mutate(id!, {
      onSuccess: () => {
        setPendingChanges(null);
        setDiscardDialogOpen(false);
      },
    });
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] gap-4">
        <Skeleton className="flex-1" />
        <Skeleton className="w-96" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Chat Panel (left) */}
      <div className="flex flex-1 flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Streaming text */}
          {isStreaming && streamingText && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2 text-sm whitespace-pre-wrap">
                {streamingText}
                <span className="animate-pulse">|</span>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isStreaming && !streamingText && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground">
                <span className="animate-pulse">{t("conversations.thinking")}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("conversations.inputPlaceholder")}
              className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              rows={2}
              disabled={isStreaming}
            />
            {isStreaming ? (
              <Button type="button" variant="outline" size="icon" onClick={abort}>
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" size="icon" disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            )}
          </form>
        </div>
      </div>

      {/* BDD Preview Panel (right) */}
      <div className="w-96 flex-shrink-0 border-l overflow-y-auto">
        <div className="p-4 space-y-4">
          <h2 className="text-lg font-semibold">{t("conversations.bddPreview")}</h2>

          {!pendingChanges && (
            <p className="text-sm text-muted-foreground">{t("conversations.noChanges")}</p>
          )}

          {pendingChanges && (
            <>
              {/* New features */}
              {pendingChanges.new_features.map((feature, i) => (
                <Card key={`new-${i}`}>
                  <CardHeader className="py-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{t("conversations.new")}</Badge>
                      <CardTitle className="text-sm">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="py-2 space-y-2">
                    {feature.description && (
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    )}
                    {feature.scenarios.map((scenario, j) => (
                      <div key={j} className="rounded border p-2">
                        <p className="text-xs font-medium">{scenario.title}</p>
                        <div className="mt-1 space-y-0.5">
                          {scenario.steps.map((step, k) => (
                            <StepLine key={k} step={step} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}

              {/* Modified features */}
              {pendingChanges.modified_features.map((mod, i) => (
                <Card key={`mod-${i}`}>
                  <CardHeader className="py-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{t("conversations.modified")}</Badge>
                      <CardTitle className="text-sm">
                        {mod.updated_title || mod.feature_id}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="py-2 space-y-2">
                    {mod.reason && (
                      <p className="text-xs text-muted-foreground">{mod.reason}</p>
                    )}
                    {mod.added_scenarios?.map((scenario, j) => (
                      <div key={`add-${j}`} className="rounded border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-2">
                        <p className="text-xs font-medium">{scenario.title}</p>
                        <div className="mt-1 space-y-0.5">
                          {scenario.steps.map((step, k) => (
                            <StepLine key={k} step={step} />
                          ))}
                        </div>
                      </div>
                    ))}
                    {mod.modified_scenarios?.map((scenario, j) => (
                      <div key={`mod-${j}`} className="rounded border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950 p-2">
                        <p className="text-xs font-medium">
                          {scenario.updated_title || scenario.scenario_id}
                        </p>
                        {scenario.updated_steps && (
                          <div className="mt-1 space-y-0.5">
                            {scenario.updated_steps.map((step, k) => (
                              <StepLine key={k} step={step} />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}

              {/* Apply / Discard buttons */}
              <Separator />
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleApply}
                  disabled={applyChanges.isPending}
                >
                  <Check className="mr-2 h-4 w-4" />
                  {t("conversations.applyAll")}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDiscardDialogOpen(true)}
                  disabled={discardChanges.isPending}
                >
                  <X className="mr-2 h-4 w-4" />
                  {t("conversations.discard")}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Discard confirmation dialog */}
      <Dialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("conversations.confirmDiscard")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("conversations.confirmDiscardMsg")}</p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("common.cancel")}</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDiscard} disabled={discardChanges.isPending}>
              {t("conversations.discard")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StepLine({ step }: { step: BddStep }) {
  const keyword = step.type.charAt(0).toUpperCase() + step.type.slice(1);
  return (
    <p className="text-xs font-mono">
      <span className="font-bold text-blue-600 dark:text-blue-400">{keyword}</span>{" "}
      {step.text}
    </p>
  );
}
