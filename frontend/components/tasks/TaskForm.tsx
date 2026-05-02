"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useCreateTask, useUpdateTask } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";
import type { Task, User, TaskCreate, TaskUpdate } from "@/types";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().optional(),
  assignee_id: z.string().nullable().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["todo", "in_progress", "review", "done"]).optional(),
  due_date: z.date().nullable().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  projectId: string;
  task?: Task;
  members: User[];
  isAdmin: boolean;
  onSuccess: () => void;
}

export function TaskForm({ projectId, task, members, isAdmin, onSuccess }: TaskFormProps) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const isEditing = !!task;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      assignee_id: task?.assignee_id || null,
      priority: (task?.priority as any) || "medium",
      status: (task?.status as any) || "todo",
      due_date: task?.due_date ? new Date(task.due_date) : null,
    },
  });

  const dueDate = watch("due_date");
  const currentPriority = watch("priority");
  const currentStatus = watch("status");
  const currentAssignee = watch("assignee_id");

  const onSubmit = (data: TaskFormData) => {
    const formattedData = {
      ...data,
      due_date: data.due_date ? data.due_date.toISOString() : null,
      assignee_id: data.assignee_id === "none" ? null : data.assignee_id,
    };

    if (isEditing) {
      updateTask.mutate(
        { taskId: task.uid, data: formattedData as TaskUpdate },
        { onSuccess }
      );
    } else {
      createTask.mutate(
        { projectId, data: formattedData as TaskCreate },
        { onSuccess }
      );
    }
  };

  const isPending = createTask.isPending || updateTask.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-20">
      <div className="space-y-4">
        {/* Admin and Member shared field: Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Task Title</Label>
          <Input
            id="title"
            placeholder="Implement authentication flow"
            disabled={!isAdmin && isEditing}
            {...register("title")}
            className={errors.title ? "border-destructive" : ""}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        {/* Admin only fields or Member status update */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={currentStatus}
              onValueChange={(val) => setValue("status", val as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={currentPriority}
              disabled={!isAdmin && isEditing}
              onValueChange={(val) => setValue("priority", val as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Assignee</Label>
          <Select
            value={currentAssignee || "none"}
            disabled={!isAdmin && isEditing}
            onValueChange={(val) => setValue("assignee_id", val === "none" ? null : val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.uid} value={m.uid}>
                  {m.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Due Date</Label>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant={"outline"}
                  disabled={!isAdmin && isEditing}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                />
              }
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate || undefined}
                onSelect={(date) => setValue("due_date", date || null)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Detailed instructions..."
            className="min-h-[120px]"
            disabled={!isAdmin && isEditing}
            {...register("description")}
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-background border-t border-border flex justify-end gap-3">
        <Button
          type="submit"
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg"
          disabled={isPending}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Update Task" : "Create Task"}
        </Button>
      </div>
    </form>
  );
}
