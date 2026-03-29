import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateRepositoryRequest } from "@openepis/types";
import { api } from "@/lib/api";

export function useRepositories(projectId: string) {
  return useQuery({
    queryKey: ["repositories", projectId],
    queryFn: () => api.repositories.list(projectId),
    enabled: !!projectId,
  });
}

export function useCreateRepository(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRepositoryRequest) => api.repositories.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["repositories", projectId],
      });
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    },
  });
}

export function useDeleteRepository(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.repositories.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["repositories", projectId],
      });
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    },
  });
}
