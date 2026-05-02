"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Filter,
  History,
  Info,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { formatDateTime, actionLabels, cn } from "@/lib/utils";
import type { ApiResponse, DashboardStats, AuditLog } from "@/types";

export default function AuditPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DashboardStats>>("/dashboard/stats");
      return res.data.data;
    },
  });

  const logs = stats?.recent_audit_logs || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">
            View all system activities and security events.
          </p>
        </div>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Metadata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No activity logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.uid} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-semibold text-xs whitespace-nowrap border-violet-200 dark:border-violet-900/30 text-violet-700 dark:text-violet-400">
                        {actionLabels[log.action] || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">{log.entity_type}</span>
                        <span className="text-xs font-mono">{log.entity_id.slice(0, 8)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {log.user_id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px] truncate">
                        {Object.keys(log.metadata).length > 0 ? (
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                            {JSON.stringify(log.metadata)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/50">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {!isLoading && logs.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-violet-500/5 p-3 rounded-lg border border-violet-500/10">
          <Info className="h-4 w-4 text-violet-500" />
          <span>Showing the most recent 10 events. Full history archiving is enabled.</span>
        </div>
      )}
    </div>
  );
}
