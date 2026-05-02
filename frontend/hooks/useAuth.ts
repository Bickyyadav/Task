"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  User,
} from "@/types";

// ── Login ───────────────────────────────────────────────────────
export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const res = await api.post<ApiResponse<TokenResponse>>("/auth/login", data);
      return res.data;
    },
    onSuccess: async (res) => {
      const { access_token, refresh_token } = res.data;

      // Fetch user profile
      const meRes = await api.get<ApiResponse<User>>("/auth/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      setAuth(meRes.data.data, access_token, refresh_token);
      toast.success("Welcome back!");
      router.push("/");
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Login failed";
      toast.error(msg);
    },
  });
}

// ── Register ────────────────────────────────────────────────────
export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const res = await api.post<ApiResponse<TokenResponse>>("/auth/register", data);
      return res.data;
    },
    onSuccess: async (res) => {
      const { access_token, refresh_token } = res.data;

      const meRes = await api.get<ApiResponse<User>>("/auth/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      setAuth(meRes.data.data, access_token, refresh_token);
      toast.success("Account created successfully!");
      router.push("/");
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Registration failed";
      toast.error(msg);
    },
  });
}

// ── Logout ──────────────────────────────────────────────────────
export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSettled: () => {
      clearAuth();
      queryClient.clear();
      router.push("/login");
    },
  });
}

// ── Get Current User ────────────────────────────────────────────
export function useMe() {
  const { isAuthenticated, setUser } = useAuthStore();

  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<User>>("/auth/me");
      setUser(res.data.data);
      return res.data.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}
