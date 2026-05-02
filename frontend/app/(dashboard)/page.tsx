"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { TaskStatusChart } from "@/components/dashboard/TaskStatusChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import type { ApiResponse, DashboardStats } from "@/types";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DashboardStats>>("/dashboard/stats");
      return res.data.data;
    },
    refetchInterval: 60000, // Refresh every 60s
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your project management overview.
        </p>
      </div>

      <StatsCards stats={data} isLoading={isLoading} />

      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <TaskStatusChart stats={data} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-3">
          <ActivityFeed logs={data?.recent_audit_logs} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
