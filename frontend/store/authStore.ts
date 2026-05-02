import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  notifications: { id: string; event: string; message: string; timestamp: Date; read: boolean }[];

  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  addNotification: (n: { event: string; message: string }) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      notifications: [],

      setAuth: (user, accessToken, refreshToken) => {
        document.cookie = `auth-token=true; path=/; max-age=${60 * 60 * 24 * 7}`;
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      setAccessToken: (token) => set({ accessToken: token }),

      setUser: (user) => set({ user }),

      clearAuth: () => {
        document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          notifications: [],
        });
      },

      addNotification: (n) =>
        set((state) => ({
          notifications: [
            {
              id: crypto.randomUUID(),
              event: n.event,
              message: n.message,
              timestamp: new Date(),
              read: false,
            },
            ...state.notifications,
          ].slice(0, 20),
        })),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
