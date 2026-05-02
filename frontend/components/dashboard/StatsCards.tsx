"use client";

import {
  FolderKanban,
  ListChecks,
  Timer,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "@/types";

interface StatsCardsProps {
  stats?: DashboardStats;
  isLoading: boolean;
}

const cards = [
  {
    label: "Total Projects",
    key: "total_projects" as const,
    icon: FolderKanban,
    gradient: "from-violet-600 to-indigo-600",
    shadow: "shadow-violet-500/20",
    bg: "bg-violet-50 dark:bg-violet-950/40",
  },
  {
    label: "Total Tasks",
    key: "total_tasks" as const,
    icon: ListChecks,
    gradient: "from-blue-600 to-cyan-600",
    shadow: "shadow-blue-500/20",
    bg: "bg-blue-50 dark:bg-blue-950/40",
  },
  {
    label: "In Progress",
    key: null,
    icon: Timer,
    gradient: "from-amber-500 to-orange-500",
    shadow: "shadow-amber-500/20",
    bg: "bg-amber-50 dark:bg-amber-950/40",
  },
  {
    label: "Overdue",
    key: "overdue_count" as const,
    icon: AlertTriangle,
    gradient: "from-rose-500 to-red-600",
    shadow: "shadow-rose-500/20",
    bg: "bg-rose-50 dark:bg-rose-950/40",
  },
];

import { useAuthStore } from "@/store/authStore";

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const getValue = (index: number): number => {
    if (!stats) return 0;
    if (index === 2) return stats.tasks_by_status.in_progress;
    const key = cards[index].key;
    if (key) return stats[key] as number;
    return 0;
  };

  const getLabel = (index: number): string => {
    const card = cards[index];
    if (!isAdmin) {
      if (card.label === "Total Tasks") return "My Tasks";
      if (card.label === "Total Projects") return "Active Projects";
    }
    return card.label;
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <Card
          key={card.label}
          className="relative overflow-hidden border-0 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {getLabel(i)}
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-bold tracking-tight">
                    {getValue(i)}
                  </p>
                )}
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} ${card.shadow} shadow-lg`}
              >
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
          <div
            className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${card.gradient}`}
          />
        </Card>
      ))}
    </div>
  );
}
