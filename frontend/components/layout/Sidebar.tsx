"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  ClipboardList,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/projects", label: "Projects", icon: FolderKanban, adminOnly: false },
  { href: "/users", label: "Users", icon: Users, adminOnly: true },
  { href: "/audit", label: "Audit Log", icon: ClipboardList, adminOnly: true },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const filteredNav = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-card border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              ProjectHub
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {filteredNav.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-violet-600/10 to-indigo-600/10 text-violet-700 dark:text-violet-400 shadow-sm border border-violet-200/50 dark:border-violet-800/50"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4.5 w-4.5",
                      isActive
                        ? "text-violet-600 dark:text-violet-400"
                        : "text-muted-foreground"
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="px-4 pb-4">
          <Separator className="mb-4" />
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-xs font-bold text-white">
              {user?.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.full_name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.role === "admin" ? "Administrator" : "Member"}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
