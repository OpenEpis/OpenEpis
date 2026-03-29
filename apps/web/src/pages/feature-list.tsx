import { useState } from "react";
import { useParams, Link } from "react-router";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeatures } from "@/hooks/use-features";
import { formatDate } from "@/lib/utils";

const statusColors: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  deprecated: "bg-gray-100 text-gray-800",
};

const statusKeys: Record<string, string> = {
  draft: "features.statusDraft",
  active: "features.statusActive",
  deprecated: "features.statusDeprecated",
};

export function FeatureListPage() {
  const { t, i18n } = useTranslation();
  const { projectId } = useParams();
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");

  const query = {
    ...(status && status !== "all" ? { status: status as "draft" | "active" | "deprecated" } : {}),
    ...(search ? { search } : {}),
  };
  const { data, isLoading, error } = useFeatures(projectId!, query);

  if (error) {
    return (
      <div className="text-destructive">
        {t("features.loadError", { message: error.message })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("features.title")}</h1>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("features.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t("features.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("features.allStatuses")}</SelectItem>
            <SelectItem value="draft">{t("features.statusDraft")}</SelectItem>
            <SelectItem value="active">{t("features.statusActive")}</SelectItem>
            <SelectItem value="deprecated">{t("features.statusDeprecated")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-60" />
                <Skeleton className="h-4 w-40" />
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {data && data.features.length === 0 && (
        <Card className="py-12 text-center">
          <p className="text-muted-foreground">
            {t("features.emptyState")}
          </p>
        </Card>
      )}

      {data && data.features.length > 0 && (
        <div className="space-y-3">
          {data.features.map((feature) => (
            <Link
              key={feature.id}
              to={`/projects/${projectId}/features/${feature.id}`}
            >
              <Card className="transition-colors hover:border-primary/30">
                <CardHeader className="py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {feature.title}
                      </CardTitle>
                      {feature.description && (
                        <CardDescription className="line-clamp-2">
                          {feature.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className={statusColors[feature.status] || ""}
                    >
                      {t(statusKeys[feature.status] || feature.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {t("common.scenario", { count: feature.scenario_count })}
                    </span>
                    <span>{t("common.version", { version: feature.version })}</span>
                    <span>
                      {formatDate(feature.updated_at, i18n.language)}
                    </span>
                    {feature.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
