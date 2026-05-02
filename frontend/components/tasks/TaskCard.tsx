"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, MessageSquare, Paperclip, MoreVertical, Calendar, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { priorityConfig, cn, getInitials, formatDate } from "@/lib/utils";
import type { Task, User } from "@/types";

interface TaskCardProps {
  task: Task;
  members: User[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

import { useAuthStore } from "@/store/authStore";

export function TaskCard({ task, members, onEdit, onDelete, isAdmin }: TaskCardProps) {
  const user = useAuthStore((s) => s.user);
  const isAssignee = task.assignee_id === user?.uid;
  const canModify = isAdmin || isAssignee;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.uid,
    data: {
      type: "Task",
      task,
    },
    disabled: !canModify,
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const assignee = members.find((m) => m.uid === task.assignee_id);

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 h-32 w-full rounded-xl border-2 border-dashed border-violet-500 bg-violet-500/5"
      />
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group border border-border/40 hover:border-violet-500/40 hover:shadow-md transition-all duration-200",
        canModify ? "cursor-grab active:cursor-grabbing" : "cursor-default opacity-80 bg-muted/20"
      )}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Badge className={cn("px-1.5 py-0 text-[10px] uppercase font-bold tracking-wider", priority.bg, priority.color)}>
            {priority.label}
          </Badge>
          
          <div className="flex items-center gap-1">
            {!canModify && <Lock className="h-3 w-3 text-muted-foreground/50" />}
            
            {(isAdmin || isAssignee) && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors"
                      onPointerDown={(e) => e.stopPropagation()} // Stop drag from triggering
                    />
                  }
                >
                  <MoreVertical className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    {isAdmin ? "Edit Task" : "Update Status"}
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(task.uid)}
                    >
                      Delete Task
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <h4 className="text-sm font-semibold leading-tight group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
          {task.title}
        </h4>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            {task.due_date && (
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-medium",
                task.is_overdue ? "text-rose-500" : "text-muted-foreground"
              )}>
                <Calendar className="h-3 w-3" />
                <span>{formatDate(task.due_date)}</span>
              </div>
            )}
          </div>

          <div className="flex -space-x-2">
            {assignee ? (
              <Avatar className="h-6 w-6 border-2 border-background ring-2 ring-transparent group-hover:ring-violet-500/20 transition-all">
                <AvatarFallback className="bg-violet-100 text-violet-700 text-[8px] font-bold">
                  {getInitials(assignee.full_name)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                <span className="text-[8px] text-muted-foreground">?</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
