"""
Task routes — CRUD with RBAC and filtering.
"""

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status

from app.core.deps import get_current_user, require_admin, require_project_member
from app.models.project import Project
from app.models.task import Task, TaskPriority, TaskStatus
from app.models.user import User, UserRole
from app.schemas.task import TaskCreate, TaskListResponse, TaskOut, TaskUpdate
from app.services.audit import log_action

router = APIRouter(tags=["Tasks"])


def _task_to_out(t: Task) -> TaskOut:
    return TaskOut(
        uid=t.uid,
        title=t.title,
        description=t.description,
        project_id=t.project_id,
        assignee_id=t.assignee_id,
        created_by=t.created_by,
        status=t.status.value,
        priority=t.priority.value,
        due_date=t.due_date,
        is_overdue=t.is_overdue,
        created_at=t.created_at,
        updated_at=t.updated_at,
    )


# ── List Tasks (with filters) ───────────────────────────────────
@router.get("/api/projects/{project_id}/tasks", response_model=dict)
async def list_tasks(
    project: Project = Depends(require_project_member),
    status_filter: Optional[str] = Query(None, alias="status"),
    priority: Optional[str] = Query(None),
    assignee_id: Optional[UUID] = Query(None),
    is_overdue: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    skip = (page - 1) * limit
    # Build criteria using Beanie expressions
    criteria = [Task.project_id == project.uid]
    
    if status_filter:
        criteria.append(Task.status == TaskStatus(status_filter))
    if priority:
        criteria.append(Task.priority == TaskPriority(priority))
    if assignee_id:
        criteria.append(Task.assignee_id == assignee_id)
    if is_overdue is not None:
        criteria.append(Task.is_overdue == is_overdue)

    query = Task.find(*criteria)
    total = await query.count()
    tasks = await query.skip(skip).limit(limit).to_list()

    return {
        "success": True,
        "data": TaskListResponse(
            items=[_task_to_out(t) for t in tasks],
            total=total,
        ).model_dump(),
        "message": "Tasks retrieved",
    }


# ── Create Task (admin only) ────────────────────────────────────
@router.post(
    "/api/projects/{project_id}/tasks",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
)
async def create_task(
    project_id: UUID,
    body: TaskCreate,
    bg: BackgroundTasks,
    admin: User = Depends(require_admin),
):
    # Verify project exists
    project = await Project.find_one(Project.uid == project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    task = Task(
        title=body.title,
        description=body.description,
        project_id=project_id,
        assignee_id=body.assignee_id,
        created_by=admin.uid,
        priority=TaskPriority(body.priority),
        due_date=body.due_date,
    )
    await task.insert()

    bg.add_task(
        log_action, admin.uid, "task.created", "task", task.uid,
        {"title": task.title, "project_id": str(project_id)},
    )

    # If assigned, notify via WebSocket and log
    if body.assignee_id:
        bg.add_task(
            log_action, admin.uid, "task.assigned", "task", task.uid,
            {"assignee_id": str(body.assignee_id)},
        )

    return {
        "success": True,
        "data": _task_to_out(task).model_dump(),
        "message": "Task created",
    }


# ── Get Task Detail ─────────────────────────────────────────────
@router.get("/api/tasks/{task_id}", response_model=dict)
async def get_task(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
):
    task = await Task.find_one(Task.uid == task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # RBAC: member must have access to the project
    if current_user.role != UserRole.ADMIN:
        project = await Project.find_one(Project.uid == task.project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        if (
            current_user.uid not in project.member_ids
            and current_user.uid != project.owner_id
        ):
            raise HTTPException(status_code=403, detail="Access denied")

    return {
        "success": True,
        "data": _task_to_out(task).model_dump(),
        "message": "Task detail",
    }


# ── Update Task ──────────────────────────────────────────────────
@router.put("/api/tasks/{task_id}", response_model=dict)
async def update_task(
    task_id: UUID,
    body: TaskUpdate,
    bg: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    task = await Task.find_one(Task.uid == task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = body.model_dump(exclude_unset=True)

    # RBAC enforcement
    if current_user.role != UserRole.ADMIN:
        # Members can only update status, and only if assigned
        if task.assignee_id != current_user.uid:
            raise HTTPException(
                status_code=403,
                detail="You can only update tasks assigned to you",
            )
        allowed = {"status"}
        extra_fields = set(update_data.keys()) - allowed
        if extra_fields:
            raise HTTPException(
                status_code=403,
                detail=f"Members can only update: {', '.join(allowed)}",
            )

    old_status = task.status.value
    old_assignee = task.assignee_id

    if "status" in update_data:
        update_data["status"] = TaskStatus(update_data["status"])
    if "priority" in update_data:
        update_data["priority"] = TaskPriority(update_data["priority"])

    for field, value in update_data.items():
        setattr(task, field, value)

    task.updated_at = datetime.now(timezone.utc)
    await task.save()

    bg.add_task(
        log_action, current_user.uid, "task.updated", "task", task.uid,
        update_data,
    )


    if "assignee_id" in update_data and update_data["assignee_id"] != old_assignee:
        bg.add_task(
            log_action, current_user.uid, "task.assigned", "task", task.uid,
            {"assignee_id": str(update_data["assignee_id"])},
        )

    return {
        "success": True,
        "data": _task_to_out(task).model_dump(),
        "message": "Task updated",
    }


# ── Delete Task (admin only) ────────────────────────────────────
@router.delete("/api/tasks/{task_id}", response_model=dict)
async def delete_task(
    task_id: UUID,
    bg: BackgroundTasks,
    admin: User = Depends(require_admin),
):
    task = await Task.find_one(Task.uid == task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    await task.delete()

    bg.add_task(
        log_action, admin.uid, "task.deleted", "task", task_id,
        {"title": task.title},
    )

    return {
        "success": True,
        "data": None,
        "message": "Task deleted",
    }
