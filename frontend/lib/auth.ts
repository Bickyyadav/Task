import { useAuthStore } from "@/store/authStore";

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

export function getRefreshToken(): string | null {
  return useAuthStore.getState().refreshToken;
}

export function setAccessToken(token: string): void {
  useAuthStore.getState().setAccessToken(token);
}

export function clearTokens(): void {
  useAuthStore.getState().clearAuth();
}

export function isAuthenticated(): boolean {
  return useAuthStore.getState().isAuthenticated;
}
