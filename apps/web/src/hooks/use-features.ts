import { useQuery } from "@tanstack/react-query";
import type { FeatureListQuery } from "@openepis/sdk";
import { api } from "@/lib/api";

export function useFeatures(projectId: string, query?: FeatureListQuery) {
  return useQuery({
    queryKey: ["features", projectId, query],
    queryFn: () => api.features.list(projectId, query),
    enabled: !!projectId,
  });
}

export function useFeature(id: string) {
  return useQuery({
    queryKey: ["features", "detail", id],
    queryFn: () => api.features.get(id),
    enabled: !!id,
  });
}

export function useRevisions(featureId: string) {
  return useQuery({
    queryKey: ["revisions", featureId],
    queryFn: () => api.features.revisions(featureId),
    enabled: !!featureId,
  });
}

export function useRevision(featureId: string, version: number) {
  return useQuery({
    queryKey: ["revisions", featureId, version],
    queryFn: () => api.features.revision(featureId, version),
    enabled: !!featureId && version > 0,
  });
}
