"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProject, useUpdateProject } from "@/hooks/useProjects";
import type { Project, ProjectCreate, ProjectUpdate } from "@/types";

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(255),
  description: z.string().max(1000).optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  project?: Project;
  onSuccess: () => void;
}

export function ProjectForm({ project, onSuccess }: ProjectFormProps) {
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const isEditing = !!project;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name || "",
      description: project?.description || "",
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    if (isEditing) {
      updateProject.mutate(
        { id: project.uid, data: data as ProjectUpdate },
        { onSuccess }
      );
    } else {
      createProject.mutate(data as ProjectCreate, { onSuccess });
    }
  };

  const isPending = createProject.isPending || updateProject.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          placeholder="New Marketing Campaign"
          {...register("name")}
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Brief overview of the project goals..."
          className={cn("min-h-[100px]", errors.description ? "border-destructive" : "")}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="submit"
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/20"
          disabled={isPending}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Save Changes" : "Create Project"}
        </Button>
      </div>
    </form>
  );
}

// Re-importing cn since it was used but not imported in this specific snippet
import { cn } from "@/lib/utils";
