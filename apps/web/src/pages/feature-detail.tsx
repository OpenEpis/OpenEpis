import { useParams, Link } from "react-router";
import { History } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { BddSteps } from "@/components/bdd-steps";
import { useFeature } from "@/hooks/use-features";

const statusColors: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  deprecated: "bg-gray-100 text-gray-800",
};

export function FeatureDetailPage() {
  const { t } = useTranslation();
  const { projectId, featureId } = useParams();
  const { data: feature, isLoading, error } = useFeature(featureId!);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-4 w-60" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !feature) {
    return (
      <div className="text-destructive">
        {error?.message || t("featureDetail.notFound")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{feature.title}</h1>
          {feature.description && (
            <p className="text-muted-foreground">{feature.description}</p>
          )}
        </div>
        <Button asChild variant="outline" size="sm">
          <Link
            to={`/projects/${projectId}/features/${featureId}/revisions`}
          >
            <History className="mr-2 h-4 w-4" />
            {t("featureDetail.history")}
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="secondary"
          className={statusColors[feature.status] || ""}
        >
          {feature.status}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {t("common.version", { version: feature.version })}
        </span>
        {feature.tags.map((tag) => (
          <Badge key={tag} variant="outline">
            {tag}
          </Badge>
        ))}
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          {t("featureDetail.scenarios", { count: feature.scenarios.length })}
        </h2>
        {feature.scenarios.map((scenario) => (
          <Card key={scenario.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{scenario.title}</CardTitle>
              {scenario.tags.length > 0 && (
                <div className="flex gap-1">
                  {scenario.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <BddSteps steps={scenario.steps} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
