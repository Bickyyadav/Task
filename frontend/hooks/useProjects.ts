"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import type {
  ApiResponse,
  PaginatedResponse,
  Project,
  ProjectCreate,
  ProjectDetail,
  ProjectUpdate,
  User,
} from "@/types";

// ── List Projects ───────────────────────────────────────────────
export function useProjects(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["projects", page, limit],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PaginatedResponse<Project>>>(
        "/projects",
        { params: { page, limit } }
      );
      return res.data.data;
    },
  });
}

// ── Get Project Detail ──────────────────────────────────────────
export function useProject(projectId: string) {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ProjectDetail>>(
        `/projects/${projectId}`
      );
      return res.data.data;
    },
    enabled: !!projectId,
  });
}

// ── Create Project ──────────────────────────────────────────────
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProjectCreate) => {
      const res = await api.post<ApiResponse<Project>>("/projects", data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created successfully");
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to create project";
      toast.error(msg);
    },
  });
}

// ── Update Project ──────────────────────────────────────────────
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProjectUpdate }) => {
      const res = await api.put<ApiResponse<Project>>(`/projects/${id}`, data);
      return res.data.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", vars.id] });
      toast.success("Project updated");
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to update project";
      toast.error(msg);
    },
  });
}

// ── Delete Project ──────────────────────────────────────────────
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to delete project";
      toast.error(msg);
    },
  });
}

// ── Add Member ──────────────────────────────────────────────────
export function useAddMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      userId,
    }: {
      projectId: string;
      userId: string;
    }) => {
      const res = await api.post<ApiResponse<Project>>(
        `/projects/${projectId}/members`,
        { user_id: userId }
      );
      return res.data.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["project", vars.projectId] });
      toast.success("Member added");
    },
    onError: (error: unknown) => {
      console.error("Add member error:", error);
      const msg =
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to add member";
      toast.error(msg);
    },
  });
}

// ── Remove Member ───────────────────────────────────────────────
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      userId,
    }: {
      projectId: string;
      userId: string;
    }) => {
      await api.delete(`/projects/${projectId}/members/${userId}`);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["project", vars.projectId] });
      toast.success("Member removed");
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to remove member";
      toast.error(msg);
    },
  });
}

// ── Fetch All Users (for member search) ─────────────────────────
export function useAllUsers() {
  return useQuery({
    queryKey: ["users", "all"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PaginatedResponse<User>>>(
        "/users",
        { params: { page: 1, limit: 100 } }
      );
      return res.data.data.items;
    },
  });
}
