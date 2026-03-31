import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useConversations(projectId: string) {
  return useQuery({
    queryKey: ["conversations", projectId],
    queryFn: () => api.conversations.list(projectId),
    enabled: !!projectId,
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ["conversation", id],
    queryFn: () => api.conversations.get(id),
    enabled: !!id,
  });
}

export function useCreateConversation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.conversations.create(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", projectId] });
    },
  });
}

export function useDeleteConversation(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.conversations.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", projectId] });
    },
  });
}

export function useApplyChanges() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.conversations.apply(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", id] });
    },
  });
}

export function useDiscardChanges() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.conversations.discard(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", id] });
    },
  });
}
