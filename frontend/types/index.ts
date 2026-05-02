// ── All TypeScript interfaces ────────────────────────────────────

export interface User {
  uid: string;
  email: string;
  full_name: string;
  role: "admin" | "member";
  is_active: boolean;
  created_at: string;
}

export type ProjectStage = "planning" | "development" | "testing" | "deployment" | "completed";

export interface Project {
  uid: string;
  name: string;
  description: string;
  owner_id: string;
  member_ids: string[];
  status: "active" | "archived";
  stage: ProjectStage;
  stage_updated_by: string | null;
  created_at: string;
}

export interface ProjectDetail extends Project {
  members: User[];
}

export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface Task {
  uid: string;
  title: string;
  description: string;
  project_id: string;
  assignee_id: string | null;
  created_by: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  uid: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export interface DashboardStats {
  total_projects: number;
  total_tasks: number;
  tasks_by_status: {
    todo: number;
    in_progress: number;
    review: number;
    done: number;
  };
  overdue_count: number;
  recent_audit_logs: AuditLog[];
}

// ── API Response Wrappers ────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

// ── Auth Types ───────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role: "admin" | "member";
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AccessTokenResponse {
  access_token: string;
  token_type: string;
}

// ── Form / Create / Update Types ─────────────────────────────────

export interface ProjectCreate {
  name: string;
  description: string;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  status?: "active" | "archived";
  stage?: ProjectStage;
}

export interface TaskCreate {
  title: string;
  description: string;
  assignee_id?: string | null;
  priority: TaskPriority;
  due_date?: string | null;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  assignee_id?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
}

export interface UserUpdate {
  role?: "admin" | "member";
  is_active?: boolean;
  full_name?: string;
}

// ── WebSocket Event Types ────────────────────────────────────────

export interface WSEvent {
  event: string;
  [key: string]: unknown;
}

export interface Notification {
  id: string;
  event: string;
  message: string;
  timestamp: Date;
  read: boolean;
}
