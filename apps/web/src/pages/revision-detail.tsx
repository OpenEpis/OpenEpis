import { useParams, Link } from "react-router";
import { ArrowLeft } from "lucide-react";
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
import { useRevision } from "@/hooks/use-features";

export function RevisionDetailPage() {
  const { t } = useTranslation();
  const { projectId, featureId, version } = useParams();
  const versionNum = Number(version);
  const { data: feature, isLoading, error } = useRevision(
    featureId!,
    versionNum,
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !feature) {
    return (
      <div className="text-destructive">
        {error?.message || t("revisions.notFound")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link
            to={`/projects/${projectId}/features/${featureId}/revisions`}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{feature.title}</h1>
          <p className="text-sm text-muted-foreground">
            {t("revisions.versionSnapshot", { version: versionNum })}
          </p>
        </div>
      </div>

      {feature.description && (
        <p className="text-muted-foreground">{feature.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{feature.status}</Badge>
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
        {feature.scenarios.map((scenario, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{scenario.title}</CardTitle>
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
