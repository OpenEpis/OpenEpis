import { useParams, Link } from "react-router";
import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRevisions } from "@/hooks/use-features";
import { formatDate } from "@/lib/utils";

export function FeatureRevisionsPage() {
  const { t, i18n } = useTranslation();
  const { projectId, featureId } = useParams();
  const { data, isLoading, error } = useRevisions(featureId!);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-60" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive">
        {t("revisions.loadError", { message: error.message })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("revisions.title")}</h1>

      {data && data.revisions.length === 0 && (
        <p className="text-muted-foreground">{t("revisions.emptyState")}</p>
      )}

      <div className="space-y-3">
        {data?.revisions.map((rev) => (
          <Link
            key={rev.version}
            to={`/projects/${projectId}/features/${featureId}/revisions/${rev.version}`}
          >
            <Card className="transition-colors hover:border-primary/30">
              <CardHeader className="flex flex-row items-start gap-3 space-y-0 py-4">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium">
                    {t("common.versionLabel", { version: rev.version })}
                  </CardTitle>
                  <CardDescription>
                    {rev.change_summary}
                  </CardDescription>
                  <p className="text-xs text-muted-foreground">
                    {t("common.by", {
                      name: rev.changed_by.name,
                      date: formatDate(rev.created_at, i18n.language),
                    })}
                  </p>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
