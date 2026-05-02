"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Filter, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useProject } from "@/hooks/useProjects";
import { useTasks, useDeleteTask } from "@/hooks/useTasks";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { TaskForm } from "@/components/tasks/TaskForm";
import { useAuthStore } from "@/store/authStore";
import type { Task, TaskStatus } from "@/types";

export default function KanbanPage() {
  const { id } = useParams() as { id: string };
  const { data: project, isLoading: isLoadingProject } = useProject(id);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const [search, setSearch] = useState("");
  const [isOverdueOnly, setIsOverdueOnly] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);

  const { data: tasksData, isLoading: isLoadingTasks } = useTasks(id, {
    is_overdue: isOverdueOnly || undefined,
    assignee_id: selectedAssignee || undefined,
  });

  const deleteTask = useDeleteTask();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("todo");

  const filteredTasks = tasksData?.items.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsSheetOpen(true);
  };

  const handleAddTask = (status: TaskStatus) => {
    setEditingTask(undefined);
    setDefaultStatus(status);
    setIsSheetOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTask.mutate(taskId);
    }
  };

  if (isLoadingProject) {
    return (
      <div className="space-y-6 h-full flex flex-col">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-4 mt-8">
          <Skeleton className="h-64 w-72 shrink-0" />
          <Skeleton className="h-64 w-72 shrink-0" />
          <Skeleton className="h-64 w-72 shrink-0" />
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0">
        <div className="space-y-1">
          <Link
            href={`/projects/${id}`}
            className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to project detail
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Kanban Board</h1>
          <p className="text-muted-foreground">{project.name}</p>
        </div>

        {isAdmin && (
          <Button
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg"
            onClick={() => handleAddTask("todo")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by title..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Popover>
          <PopoverTrigger render={<Button variant="outline" size="sm" className="h-10" />}>
            <Filter className="mr-2 h-4 w-4" />
            Advanced Filters
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4 p-2">
              <h4 className="font-semibold text-sm">Filter Tasks</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="overdue"
                    checked={isOverdueOnly}
                    onCheckedChange={(val) => setIsOverdueOnly(!!val)}
                  />
                  <Label htmlFor="overdue">Overdue only</Label>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">By Assignee</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedAssignee === null ? "secondary" : "ghost"}
                      size="sm"
                      className="text-[10px] h-7 px-2"
                      onClick={() => setSelectedAssignee(null)}
                    >
                      Everyone
                    </Button>
                    {project.members.map((m) => (
                      <Button
                        key={m.uid}
                        variant={selectedAssignee === m.uid ? "secondary" : "ghost"}
                        size="sm"
                        className="text-[10px] h-7 px-2"
                        onClick={() => setSelectedAssignee(m.uid)}
                      >
                        {m.full_name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Board */}
      <div className="flex-1 min-h-0">
        {isLoadingTasks ? (
          <div className="flex gap-6 h-full overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-72 shrink-0 space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <KanbanBoard
            tasks={filteredTasks || []}
            members={project.members}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onAddTask={handleAddTask}
            isAdmin={isAdmin}
          />
        )}
      </div>

      {/* Task Drawer */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>{editingTask ? "Edit Task" : "Create New Task"}</SheetTitle>
            <SheetDescription>
              {editingTask
                ? "Update task details and assignments."
                : `Add a new task to ${project.name}.`}
            </SheetDescription>
          </SheetHeader>
          <TaskForm
            projectId={id}
            task={editingTask}
            members={project.members}
            isAdmin={isAdmin}
            onSuccess={() => setIsSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
