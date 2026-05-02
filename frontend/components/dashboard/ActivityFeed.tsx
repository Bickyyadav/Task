"use client";

import {
  FilePlus,
  FileEdit,
  FileX,
  UserPlus,
  UserMinus,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative, actionLabels } from "@/lib/utils";
import type { AuditLog } from "@/types";

interface ActivityFeedProps {
  logs?: AuditLog[];
  isLoading: boolean;
}

const actionIcons: Record<string, any> = {
  "user.registered": UserPlus,
  "user.login": CheckCircle2,
  "project.created": FilePlus,
  "project.updated": FileEdit,
  "project.deleted": FileX,
  "project.member_added": UserPlus,
  "project.member_removed": UserMinus,
  "task.created": FilePlus,
  "task.updated": FileEdit,
  "task.deleted": FileX,
  "task.assigned": UserPlus,
  "task.status_changed": Clock,
};

export function ActivityFeed({ logs, isLoading }: ActivityFeedProps) {
  return (
    <Card className="border-0 shadow-lg flex flex-col h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[400px] px-6">
          {isLoading ? (
            <div className="space-y-4 pb-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-sm">
              No recent activity
            </div>
          ) : (
            <div className="space-y-6 pb-6">
              {logs.map((log) => {
                const Icon = actionIcons[log.action] || Clock;
                return (
                  <div key={log.uid} className="relative flex gap-4 group">
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted border border-border group-hover:border-violet-500/50 transition-colors">
                      <Icon className="h-5 w-5 text-muted-foreground group-hover:text-violet-500 transition-colors" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-medium leading-none">
                        {actionLabels[log.action] || log.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.entity_type} {log.entity_id.slice(0, 8)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground/60" />
                        <span className="text-[10px] text-muted-foreground/60">
                          {formatRelative(log.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
