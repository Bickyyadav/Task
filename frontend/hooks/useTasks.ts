"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import type {
  ApiResponse,
  PaginatedResponse,
  Task,
  TaskCreate,
  TaskStatus,
  TaskUpdate,
} from "@/types";

// ── List Tasks for Project ──────────────────────────────────────
export function useTasks(
  projectId: string,
  filters?: {
    status?: string;
    priority?: string;
    assignee_id?: string;
    is_overdue?: boolean;
  }
) {
  return useQuery({
    queryKey: ["tasks", projectId, filters],
    queryFn: async () => {
      const params: Record<string, string | boolean> = {};
      if (filters?.status) params.status = filters.status;
      if (filters?.priority) params.priority = filters.priority;
      if (filters?.assignee_id) params.assignee_id = filters.assignee_id;
      if (filters?.is_overdue !== undefined) params.is_overdue = filters.is_overdue;
      params.limit = "100";

      const res = await api.get<ApiResponse<PaginatedResponse<Task>>>(
        `/projects/${projectId}/tasks`,
        { params }
      );
      return res.data.data;
    },
    enabled: !!projectId,
  });
}

// ── Create Task ─────────────────────────────────────────────────
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      data,
    }: {
      projectId: string;
      data: TaskCreate;
    }) => {
      const res = await api.post<ApiResponse<Task>>(
        `/projects/${projectId}/tasks`,
        data
      );
      return res.data.data;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", task.project_id] });
      toast.success("Task created");
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to create task";
      toast.error(msg);
    },
  });
}

// ── Update Task (with optimistic update for drag-drop) ──────────
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: TaskUpdate }) => {
      const res = await api.put<ApiResponse<Task>>(`/tasks/${taskId}`, data);
      return res.data.data;
    },
    onMutate: async ({ taskId, data }) => {
      // Only optimistically update status changes (drag-drop)
      if (!data.status) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot all task queries
      const queries = queryClient.getQueriesData<PaginatedResponse<Task>>({
        queryKey: ["tasks"],
      });

      // Optimistic update
      queries.forEach(([queryKey, queryData]) => {
        if (queryData?.items) {
          queryClient.setQueryData(queryKey, {
            ...queryData,
            items: queryData.items.map((t: Task) =>
              t.uid === taskId ? { ...t, status: data.status as TaskStatus } : t
            ),
          });
        }
      });

      return { queries };
    },
    onError: (error, _vars, context) => {
      // Rollback optimistic update
      if (context?.queries) {
        context.queries.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey, queryData);
        });
      }
      const msg =
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to update task";
      toast.error(msg);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

// ── Delete Task ─────────────────────────────────────────────────
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted");
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to delete task";
      toast.error(msg);
    },
  });
}
