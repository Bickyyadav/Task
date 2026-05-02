"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  LayoutDashboard,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useProject, useDeleteProject } from "@/hooks/useProjects";
import { useAuthStore } from "@/store/authStore";
import { MemberManager } from "@/components/projects/MemberManager";
import { formatDate, projectStatusConfig, projectStageConfig } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateProject } from "@/hooks/useProjects";
import type { ProjectStage } from "@/types";

export default function ProjectDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: project, isLoading } = useProject(id);
  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";
  const isMember = project?.member_ids.includes(user?.uid || "") || project?.owner_id === user?.uid;

  const handleDelete = () => {
    deleteProject.mutate(id, {
      onSuccess: () => router.push("/projects"),
    });
  };

  const handleStageChange = (newStage: ProjectStage) => {
    updateProject.mutate({ id, data: { stage: newStage } });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold">Project not found</h2>
        <Link href="/projects" className={cn(buttonVariants({ variant: "link" }), "mt-2")}>
          Back to projects
        </Link>
      </div>
    );
  }

  const status = projectStatusConfig[project.status] || projectStatusConfig.active;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Link
            href="/projects"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to projects
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge className={cn("px-2.5 py-0.5", status.bg, status.color)}>
              {status.label}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">Current Stage:</span>
            {isMember || isAdmin ? (
              <Select
                value={project.stage}
                onValueChange={(val) => handleStageChange(val as ProjectStage)}
                disabled={updateProject.isPending}
              >
                <SelectTrigger className={cn(
                  "h-7 w-[140px] text-xs font-medium border-none shadow-none focus:ring-0 px-2",
                  projectStageConfig[project.stage]?.bg,
                  projectStageConfig[project.stage]?.color
                )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(projectStageConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline" className={cn(
                "h-6 text-[10px] uppercase tracking-wider",
                projectStageConfig[project.stage]?.bg,
                projectStageConfig[project.stage]?.color
              )}>
                {projectStageConfig[project.stage]?.label}
              </Badge>
            )}
            
            {project.stage_updated_by && (
              <span className="text-[10px] text-muted-foreground ml-2 italic">
                (Last updated by {project.members?.find(m => m.uid === project.stage_updated_by)?.full_name || "a member"})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link 
            href={`/projects/${id}/tasks`}
            className={cn(buttonVariants(), "bg-violet-600 hover:bg-violet-700 shadow-md")}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            View Kanban
          </Link>

          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="outline" className="text-destructive hover:bg-destructive/10 border-destructive/20" />}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the project <strong>{project.name}</strong> and all its associated tasks. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    Delete Project
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">About this project</h2>
            <p className="text-muted-foreground leading-relaxed">
              {project.description || "No description provided for this project."}
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Created on</p>
                  <p className="text-sm font-medium">{formatDate(project.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Team Size</p>
                  <p className="text-sm font-medium">{project.member_ids.length} Members</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent tasks or other metrics could go here */}
        </div>

        {/* Right Column: Members */}
        <div className="space-y-6">
          <MemberManager project={project} isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  );
}

// Re-importing cn for the Badge
import { cn } from "@/lib/utils";
