"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

const MAX_RETRIES = 5;
const BASE_DELAY = 1000;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const retryCount = useRef(0);
  const retryTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const queryClient = useQueryClient();

  const { user, accessToken, isAuthenticated, addNotification } = useAuthStore();

  const connect = useCallback(() => {
    if (!user || !accessToken || !isAuthenticated) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
    const url = `${wsUrl}/${user.uid}?token=${accessToken}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        retryCount.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === "pong") return;

          handleEvent(data);
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        // Reconnect with exponential backoff
        if (retryCount.current < MAX_RETRIES && isAuthenticated) {
          const delay = BASE_DELAY * Math.pow(2, retryCount.current);
          retryCount.current += 1;
          retryTimeout.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // ignore connection errors
    }
  }, [user, accessToken, isAuthenticated]);

  const handleEvent = useCallback(
    (data: { event: string; [key: string]: unknown }) => {
      switch (data.event) {
        case "task.assigned":
          toast.info(`Task assigned: ${data.task_title || "New task"}`);
          addNotification({
            event: data.event,
            message: `You were assigned to "${data.task_title || "a task"}"`,
          });
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          break;

        case "task.status_changed":
          toast.info(
            `Task status: ${data.old_status} → ${data.new_status}`
          );
          addNotification({
            event: data.event,
            message: `Task status changed to ${data.new_status}`,
          });
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          break;

        case "project.member_added":
          toast.info(`Added to project: ${data.project_name || "a project"}`);
          addNotification({
            event: data.event,
            message: `You were added to "${data.project_name || "a project"}"`,
          });
          queryClient.invalidateQueries({ queryKey: ["projects"] });
          queryClient.invalidateQueries({ queryKey: ["project"] });
          break;

        default:
          break;
      }
    },
    [queryClient, addNotification]
  );

  const disconnect = useCallback(() => {
    if (retryTimeout.current) {
      clearTimeout(retryTimeout.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    retryCount.current = 0;
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { disconnect };
}
