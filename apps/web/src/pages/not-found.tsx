import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold">{t("notFound.title")}</h1>
      <p className="text-muted-foreground">{t("notFound.message")}</p>
      <Button asChild variant="outline">
        <Link to="/projects">{t("common.goToProjects")}</Link>
      </Button>
    </div>
  );
}
