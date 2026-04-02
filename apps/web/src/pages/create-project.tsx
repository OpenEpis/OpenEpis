import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCreateProject } from "@/hooks/use-projects";

export function CreateProjectPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError(t("createProject.nameRequired"));
      return;
    }
    setNameError("");
    createProject.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: (project) => {
          navigate(`/projects/${project.id}`);
        },
      },
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>{t("createProject.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                {t("createProject.nameLabel")} <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                data-testid="create-project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("createProject.namePlaceholder")}
              />
              {nameError && (
                <p className="text-sm text-destructive" data-testid="create-project-name-error">{nameError}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                {t("createProject.descriptionLabel")}
              </label>
              <Textarea
                id="description"
                data-testid="create-project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("createProject.descriptionPlaceholder")}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                data-testid="create-project-submit"
                disabled={createProject.isPending}
              >
                {createProject.isPending ? t("createProject.creating") : t("createProject.create")}
              </Button>
              <Button
                type="button"
                variant="outline"
                data-testid="create-project-cancel"
                onClick={() => navigate(-1)}
              >
                {t("common.cancel")}
              </Button>
            </div>
            {createProject.isError && (
              <p className="text-sm text-destructive">
                {createProject.error.message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
