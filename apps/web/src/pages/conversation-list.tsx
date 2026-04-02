import { useParams, useNavigate } from "react-router";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
} from "@/hooks/use-conversations";
import { formatDate } from "@/lib/utils";

export function ConversationListPage() {
  const { t, i18n } = useTranslation();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useConversations(projectId!);
  const createConversation = useCreateConversation(projectId!);
  const deleteConversation = useDeleteConversation(projectId!);

  function handleCreate() {
    createConversation.mutate(undefined, {
      onSuccess: (conversation) => {
        navigate(`/projects/${projectId}/conversations/${conversation.id}`);
      },
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive">{error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("conversations.title")}</h1>
        <Button onClick={handleCreate} disabled={createConversation.isPending} data-testid="conversation-list-new-btn">
          <Plus className="mr-2 h-4 w-4" />
          {t("conversations.new")}
        </Button>
      </div>

      {data?.conversations.length === 0 && (
        <p className="text-sm text-muted-foreground" data-testid="conversation-list-empty">{t("conversations.emptyState")}</p>
      )}

      {data?.conversations.map((conv) => (
        <Card
          key={conv.id}
          className="cursor-pointer transition-colors hover:bg-muted/50"
          data-testid="conversation-list-card"
          onClick={() => navigate(`/projects/${projectId}/conversations/${conv.id}`)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-sm font-medium">
                  {t("conversations.conversation")} &mdash;{" "}
                  {formatDate(conv.created_at, i18n.language)}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {t("conversations.messageCount", { count: conv.message_count })}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              data-testid="conversation-list-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                deleteConversation.mutate(conv.id);
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
