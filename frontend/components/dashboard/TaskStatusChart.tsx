"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "@/types";

interface TaskStatusChartProps {
  stats?: DashboardStats;
  isLoading: boolean;
}

const COLORS = [
  { name: "To Do", color: "#64748b", key: "todo" },
  { name: "In Progress", color: "#3b82f6", key: "in_progress" },
  { name: "Review", color: "#a855f7", key: "review" },
  { name: "Done", color: "#10b981", key: "done" },
];

export function TaskStatusChart({ stats, isLoading }: TaskStatusChartProps) {
  const data = COLORS.map((c) => ({
    name: c.name,
    value: stats?.tasks_by_status?.[c.key as keyof typeof stats.tasks_by_status] ?? 0,
    color: c.color,
  }));

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Tasks by Status</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Skeleton className="h-48 w-48 rounded-full" />
          </div>
        ) : total === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            No tasks yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span className="text-sm text-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
