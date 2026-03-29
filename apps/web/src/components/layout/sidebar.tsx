import { Link, useParams, useLocation } from "react-router";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import {
  FolderOpen,
  LayoutDashboard,
  FileText,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useProjects } from "@/hooks/use-projects";
import { sidebarCollapsedAtom } from "@/store/ui";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useAtom(sidebarCollapsedAtom);
  const { projectId } = useParams();
  const location = useLocation();
  const { data } = useProjects();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
        collapsed ? "w-14" : "w-60",
      )}
    >
      <div className="flex h-14 items-center justify-between border-b px-3">
        {!collapsed && (
          <Link to="/projects" className="text-lg font-semibold">
            OpenEpis
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {!collapsed && (
          <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">
            {t("sidebar.projects")}
          </p>
        )}
        {data?.projects.map((project) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent",
              projectId === project.id && "bg-sidebar-accent font-medium",
            )}
            title={project.name}
          >
            <FolderOpen className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <span className="truncate">{project.name}</span>
            )}
          </Link>
        ))}

        {projectId && (
          <>
            <Separator className="my-2" />
            {!collapsed && (
              <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">
                {t("sidebar.currentProject")}
              </p>
            )}
            <Link
              to={`/projects/${projectId}`}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent",
                location.pathname === `/projects/${projectId}` &&
                  "bg-sidebar-accent font-medium",
              )}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{t("sidebar.overview")}</span>}
            </Link>
            <Link
              to={`/projects/${projectId}/features`}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent",
                location.pathname.startsWith(
                  `/projects/${projectId}/features`,
                ) && "bg-sidebar-accent font-medium",
              )}
            >
              <FileText className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{t("sidebar.features")}</span>}
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}
