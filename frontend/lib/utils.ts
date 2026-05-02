import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Priority Colors ─────────────────────────────────────────────
export const priorityConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  low: { label: "Low", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800" },
  medium: { label: "Medium", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-950 border-amber-200 dark:border-amber-800" },
  high: { label: "High", color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-950 border-orange-200 dark:border-orange-800" },
  critical: { label: "Critical", color: "text-red-700 dark:text-red-400", bg: "bg-red-100 dark:bg-red-950 border-red-200 dark:border-red-800" },
};

// ── Status Colors ───────────────────────────────────────────────
export const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  todo: { label: "To Do", color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700" },
  in_progress: { label: "In Progress", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-950 border-blue-200 dark:border-blue-800" },
  review: { label: "Review", color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-950 border-purple-200 dark:border-purple-800" },
  done: { label: "Done", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800" },
};

// ── Project Status Colors ───────────────────────────────────────
export const projectStatusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  active: { label: "Active", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800" },
  archived: { label: "Archived", color: "text-slate-700 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700" },
};

// ── Project Stage Colors ────────────────────────────────────────
export const projectStageConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  planning: { label: "Planning", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-950 border-blue-200 dark:border-blue-800" },
  development: { label: "Development", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-950 border-amber-200 dark:border-amber-800" },
  testing: { label: "Testing", color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-950 border-purple-200 dark:border-purple-800" },
  deployment: { label: "Deployment", color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-950 border-orange-200 dark:border-orange-800" },
  completed: { label: "Completed", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800" },
};

// ── Date Formatters ─────────────────────────────────────────────
export function formatDate(date: string | Date): string {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "MMM d, yyyy HH:mm");
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

// ── Action Label Map ────────────────────────────────────────────
export const actionLabels: Record<string, string> = {
  "user.registered": "User Registered",
  "user.login": "User Logged In",
  "project.created": "Project Created",
  "project.updated": "Project Updated",
  "project.deleted": "Project Deleted",
  "project.member_added": "Member Added",
  "project.member_removed": "Member Removed",
  "task.created": "Task Created",
  "task.updated": "Task Updated",
  "task.deleted": "Task Deleted",
  "task.assigned": "Task Assigned",
  "task.status_changed": "Status Changed",
};

// ── Initials from Name ──────────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
