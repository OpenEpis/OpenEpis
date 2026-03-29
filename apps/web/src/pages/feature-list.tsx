import { useState } from "react";
import { useParams, Link } from "react-router";
import { Search } from "lucide-react";
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

const statusColors: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  deprecated: "bg-gray-100 text-gray-800",
};

export function FeatureListPage() {
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
        Failed to load features: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Features</h1>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search features..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="deprecated">Deprecated</SelectItem>
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
            No BDD features found.
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
                      {feature.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {feature.scenario_count}{" "}
                      {feature.scenario_count === 1
                        ? "scenario"
                        : "scenarios"}
                    </span>
                    <span>v{feature.version}</span>
                    <span>
                      {new Date(feature.updated_at).toLocaleDateString()}
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
