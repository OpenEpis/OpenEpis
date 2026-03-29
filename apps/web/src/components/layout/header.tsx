import React from "react";
import { useMatches } from "react-router";
import { useTranslation } from "react-i18next";
import { Menu } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";

interface BreadcrumbHandle {
  breadcrumb: string | ((data: unknown) => string);
}

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { t } = useTranslation();
  const matches = useMatches();

  const crumbs = matches
    .filter((m) => (m.handle as BreadcrumbHandle | undefined)?.breadcrumb)
    .map((m) => {
      const handle = m.handle as BreadcrumbHandle;
      const raw =
        typeof handle.breadcrumb === "function"
          ? handle.breadcrumb(m.data)
          : handle.breadcrumb;
      const label = raw.startsWith("breadcrumb.") ? t(raw) : raw;
      return { path: m.pathname, label };
    });

  return (
    <header className="flex h-14 items-center gap-3 border-b px-4">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-4 w-4" />
      </Button>
      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          {crumbs.map((crumb, i) => (
            <React.Fragment key={crumb.path}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                <BreadcrumbLink href={crumb.path}>
                  {crumb.label}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <LanguageSwitcher />
    </header>
  );
}
