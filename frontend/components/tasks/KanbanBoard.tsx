"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "./TaskCard";
import type { Task, User, TaskStatus } from "@/types";
import { useUpdateTask } from "@/hooks/useTasks";
import { useAuthStore } from "@/store/authStore";

interface KanbanBoardProps {
  tasks: Task[];
  members: User[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (status: TaskStatus) => void;
  isAdmin: boolean;
}

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];

export function KanbanBoard({
  tasks,
  members,
  onEditTask,
  onDeleteTask,
  onAddTask,
  isAdmin,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const updateTask = useUpdateTask();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const tasksByStatus = useMemo(() => {
    return COLUMNS.reduce((acc, col) => {
      acc[col.id] = tasks.filter((t) => t.status === col.id);
      return acc;
    }, {} as Record<TaskStatus, Task[]>);
  }, [tasks]);

  const user = useAuthStore((s) => s.user);

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Task") {
      const task = event.active.data.current.task as Task;
      
      // If not admin, can only drag tasks assigned to them
      if (!isAdmin && task.assignee_id !== user?.uid) {
        return;
      }
      
      setActiveTask(task);
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;

    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    // Check if we dropped on a column or a task
    let newStatus: TaskStatus | null = null;
    if (COLUMNS.some((col) => col.id === overId)) {
      newStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.uid === overId);
      if (overTask) newStatus = overTask.status;
    }

    if (newStatus && activeTask && activeTask.status !== newStatus) {
      updateTask.mutate({
        taskId: activeTaskId,
        data: { status: newStatus },
      });
    }
  };

  return (
    <div className="flex h-full gap-6 overflow-x-auto pb-4 scrollbar-hide">
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className="flex flex-col w-72 shrink-0 rounded-xl bg-muted/30 border border-border/50 p-3"
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  {col.label}
                </h3>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                  {tasksByStatus[col.id].length}
                </span>
              </div>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-muted"
                  onClick={() => onAddTask(col.id)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-3 min-h-[150px]">
              <SortableContext
                items={tasksByStatus[col.id].map((t) => t.uid)}
                strategy={verticalListSortingStrategy}
              >
                {tasksByStatus[col.id].map((task) => (
                  <TaskCard
                    key={task.uid}
                    task={task}
                    members={members}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    isAdmin={isAdmin}
                  />
                ))}
              </SortableContext>
            </div>
            
            {isAdmin && tasksByStatus[col.id].length === 0 && (
               <Button
                variant="ghost"
                className="mt-2 w-full justify-start text-muted-foreground hover:text-foreground text-xs h-10 border border-dashed border-border/60 rounded-xl"
                onClick={() => onAddTask(col.id)}
              >
                <Plus className="mr-2 h-3 w-3" />
                Add task
              </Button>
            )}
          </div>
        ))}

        {typeof document !== "undefined" &&
          createPortal(
            <DragOverlay
              dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                  styles: {
                    active: {
                      opacity: "0.5",
                    },
                  },
                }),
              }}
            >
              {activeTask ? (
                <div className="w-72 scale-105 shadow-2xl">
                  <TaskCard
                    task={activeTask}
                    members={members}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    isAdmin={isAdmin}
                  />
                </div>
              ) : null}
            </DragOverlay>,
            document.body
          )}
      </DndContext>
    </div>
  );
}
