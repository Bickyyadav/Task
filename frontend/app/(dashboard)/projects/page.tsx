"use client";

import { useState } from "react";
import { Plus, Search, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { useAuthStore } from "@/store/authStore";

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data, isLoading } = useProjects();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const filteredProjects = data?.items.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage and monitor all your team projects.
          </p>
        </div>

        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={<Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/20" />}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Project</DialogTitle>
                <DialogDescription>
                  Start a new project and add your team members.
                </DialogDescription>
              </DialogHeader>
              <ProjectForm onSuccess={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          className="pl-10 max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredProjects && filteredProjects.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.uid} project={project} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <FolderKanban className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No projects found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            {search 
              ? "We couldn't find any projects matching your search."
              : "You haven't been added to any projects yet."}
          </p>
          {isAdmin && !search && (
            <Button 
              variant="outline" 
              className="mt-6"
              onClick={() => setIsDialogOpen(true)}
            >
              Create your first project
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
