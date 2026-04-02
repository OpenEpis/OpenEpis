import { Link } from "react-router";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/use-projects";
import { formatDate } from "@/lib/utils";

export function ProjectListPage() {
  const { t, i18n } = useTranslation();
  const { data, isLoading, error } = useProjects();

  if (error) {
    return (
      <div className="text-destructive">{t("projects.loadError", { message: error.message })}</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("projects.title")}</h1>
        <Button asChild>
          <Link to="/projects/new" data-testid="project-list-create-btn">
            <Plus className="mr-2 h-4 w-4" />
            {t("projects.createProject")}
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {data && data.projects.length === 0 && (
        <Card className="py-12 text-center" data-testid="project-list-empty">
          <p className="mb-4 text-muted-foreground">
            {t("projects.emptyState")}
          </p>
          <Button asChild>
            <Link to="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("projects.createProject")}
            </Link>
          </Button>
        </Card>
      )}

      {data && data.projects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`} data-testid="project-list-card">
              <Card className="transition-colors hover:border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription className="flex items-center justify-between">
                    <span>
                      {t("common.feature", { count: project.feature_count })}
                    </span>
                    <span>
                      {formatDate(project.created_at, i18n.language)}
                    </span>
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
