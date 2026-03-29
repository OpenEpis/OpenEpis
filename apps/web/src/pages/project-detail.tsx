import { useState, type FormEvent } from "react";
import { useParams, Link } from "react-router";
import {
  FolderOpen,
  GitBranch,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { useTranslation, Trans } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useProject } from "@/hooks/use-projects";
import {
  useRepositories,
  useCreateRepository,
  useDeleteRepository,
} from "@/hooks/use-repositories";
import { formatDate } from "@/lib/utils";

export function ProjectDetailPage() {
  const { t, i18n } = useTranslation();
  const { projectId } = useParams();
  const { data: project, isLoading, error } = useProject(projectId!);
  const { data: repoData } = useRepositories(projectId!);
  const createRepo = useCreateRepository(projectId!);
  const deleteRepo = useDeleteRepository(projectId!);

  const [addOpen, setAddOpen] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [gitUrl, setGitUrl] = useState("");
  const [branch, setBranch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-destructive">
        {error?.message || t("projects.notFound")}
      </div>
    );
  }

  function handleAddRepo(e: FormEvent) {
    e.preventDefault();
    createRepo.mutate(
      {
        name: repoName.trim(),
        git_url: gitUrl.trim(),
        default_branch: branch.trim() || undefined,
      },
      {
        onSuccess: () => {
          setAddOpen(false);
          setRepoName("");
          setGitUrl("");
          setBranch("");
        },
      },
    );
  }

  function handleDeleteRepo() {
    if (!deleteId) return;
    deleteRepo.mutate(deleteId, {
      onSuccess: () => setDeleteId(null),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        {project.description && (
          <p className="mt-1 text-muted-foreground">{project.description}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <CardDescription>{t("projectDetail.project")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {t("common.created", { date: formatDate(project.created_at, i18n.language) })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <CardDescription>{t("projectDetail.features")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{project.feature_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            <CardDescription>{t("projectDetail.repositories")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{project.repo_count}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <Button asChild variant="outline">
          <Link to={`/projects/${projectId}/features`}>{t("projectDetail.viewFeatures")}</Link>
        </Button>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("projectDetail.repositories")}</h2>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {t("projectDetail.addRepository")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("projectDetail.addRepository")}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddRepo} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="repo-name" className="text-sm font-medium">
                    {t("projectDetail.repoNameLabel")}
                  </label>
                  <Input
                    id="repo-name"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    placeholder={t("projectDetail.repoNamePlaceholder")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="git-url" className="text-sm font-medium">
                    {t("projectDetail.gitUrlLabel")}
                  </label>
                  <Input
                    id="git-url"
                    value={gitUrl}
                    onChange={(e) => setGitUrl(e.target.value)}
                    placeholder={t("projectDetail.gitUrlPlaceholder")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="branch" className="text-sm font-medium">
                    {t("projectDetail.defaultBranchLabel")}
                  </label>
                  <Input
                    id="branch"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder={t("projectDetail.defaultBranchPlaceholder")}
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      {t("common.cancel")}
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={createRepo.isPending}>
                    {createRepo.isPending ? t("projectDetail.adding") : t("common.add")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {repoData?.repositories.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {t("projectDetail.noRepositories")}
          </p>
        )}

        {repoData?.repositories.map((repo) => (
          <Card key={repo.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
              <div>
                <CardTitle className="text-sm font-medium">
                  {repo.name}
                </CardTitle>
                <CardDescription className="text-xs">
                  {repo.git_url}
                  {repo.default_branch && ` (${repo.default_branch})`}
                </CardDescription>
              </div>
              <Dialog
                open={deleteId === repo.id}
                onOpenChange={(open) => setDeleteId(open ? repo.id : null)}
              >
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("projectDetail.deleteRepository")}</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    <Trans
                      i18nKey="projectDetail.confirmDelete"
                      values={{ name: repo.name }}
                      components={{ strong: <strong /> }}
                    />
                  </p>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">{t("common.cancel")}</Button>
                    </DialogClose>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteRepo}
                      disabled={deleteRepo.isPending}
                    >
                      {deleteRepo.isPending ? t("projectDetail.deleting") : t("common.delete")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
