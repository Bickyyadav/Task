"use client";

import Link from "next/link";
import { FolderKanban, Users, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { projectStatusConfig, cn } from "@/lib/utils";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const status = projectStatusConfig[project.status] || projectStatusConfig.active;

  return (
    <Card className="group border border-border/50 bg-card hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300">
      <CardHeader className="p-5 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 group-hover:bg-violet-500 group-hover:text-white transition-colors duration-300">
            <FolderKanban className="h-5 w-5" />
          </div>
          <Badge
            className={cn(
              "font-medium shadow-none",
              status.bg,
              status.color
            )}
          >
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 pt-2">
        <h3 className="text-lg font-semibold tracking-tight mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
          {project.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 h-10">
          {project.description || "No description provided."}
        </p>
      </CardContent>

      <CardFooter className="p-5 pt-0 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>{project.member_ids.length} members</span>
        </div>
        
        <Link 
          href={`/projects/${project.uid}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
        >
          View Details
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </CardFooter>
    </Card>
  );
}
