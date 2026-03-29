import { createBrowserRouter, Navigate } from "react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { NotFoundPage } from "@/pages/not-found";
import { ProjectListPage } from "@/pages/project-list";
import { CreateProjectPage } from "@/pages/create-project";
import { ProjectDetailPage } from "@/pages/project-detail";
import { FeatureListPage } from "@/pages/feature-list";
import { FeatureDetailPage } from "@/pages/feature-detail";
import { FeatureRevisionsPage } from "@/pages/feature-revisions";
import { RevisionDetailPage } from "@/pages/revision-detail";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/projects" replace />,
      },
      {
        path: "projects",
        handle: { breadcrumb: "breadcrumb.projects" },
        children: [
          {
            index: true,
            element: <ProjectListPage />,
          },
          {
            path: "new",
            element: <CreateProjectPage />,
            handle: { breadcrumb: "breadcrumb.newProject" },
          },
          {
            path: ":projectId",
            handle: { breadcrumb: "breadcrumb.project" },
            children: [
              {
                index: true,
                element: <ProjectDetailPage />,
              },
              {
                path: "features",
                handle: { breadcrumb: "breadcrumb.features" },
                children: [
                  {
                    index: true,
                    element: <FeatureListPage />,
                  },
                  {
                    path: ":featureId",
                    handle: { breadcrumb: "breadcrumb.feature" },
                    children: [
                      {
                        index: true,
                        element: <FeatureDetailPage />,
                      },
                      {
                        path: "revisions",
                        handle: { breadcrumb: "breadcrumb.revisions" },
                        children: [
                          {
                            index: true,
                            element: <FeatureRevisionsPage />,
                          },
                          {
                            path: ":version",
                            element: <RevisionDetailPage />,
                            handle: { breadcrumb: "breadcrumb.revision" },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
