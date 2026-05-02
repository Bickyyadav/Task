"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/store/authStore";
import { formatRelative } from "@/lib/utils";

export function NotificationBell() {
  const { notifications, markAllRead, markNotificationRead } = useAuthStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative rounded-full" />}>
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-1 text-[10px] font-bold text-white shadow-lg shadow-violet-500/30">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        <span className="sr-only">Notifications</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <div className="flex items-center justify-between p-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={markAllRead}
            >
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-64">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                No notifications yet
              </p>
            </div>
          ) : (
            notifications.slice(0, 5).map((n) => (
              <DropdownMenuItem
                key={n.id}
                className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                onClick={() => markNotificationRead(n.id)}
              >
                <div className="flex items-center gap-2 w-full">
                  {!n.read && (
                    <span className="h-2 w-2 rounded-full bg-violet-600 shrink-0" />
                  )}
                  <p className="text-sm font-medium flex-1">{n.message}</p>
                </div>
                <p className="text-xs text-muted-foreground pl-4">
                  {formatRelative(n.timestamp)}
                </p>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
