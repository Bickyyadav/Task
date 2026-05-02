"""
Dashboard routes — aggregated stats.
"""

from beanie.operators import Or
from fastapi import APIRouter, Depends

from app.core.deps import get_current_user
from app.models.audit_log import AuditLog
from app.models.project import Project
from app.models.task import Task, TaskStatus
from app.models.user import User, UserRole

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


async def _fetch_stats(user: User) -> dict:
    """Compute dashboard statistics."""
    is_admin = user.role == UserRole.ADMIN

    if is_admin:
        total_projects = await Project.find_all().count()
        total_tasks = await Task.find_all().count()
        tasks_todo = await Task.find(Task.status == TaskStatus.TODO).count()
        tasks_in_progress = await Task.find(Task.status == TaskStatus.IN_PROGRESS).count()
        tasks_review = await Task.find(Task.status == TaskStatus.REVIEW).count()
        tasks_done = await Task.find(Task.status == TaskStatus.DONE).count()
        overdue_count = await Task.find(Task.is_overdue == True).count()  # noqa: E712
    else:
        # Members only see their projects
        # Use Beanie criteria to ensure proper UUID handling
        projects = await Project.find(
            Or(Project.owner_id == user.uid, Project.member_ids == user.uid)
        ).to_list()
        project_ids = [p.uid for p in projects]
        total_projects = len(project_ids)

        if project_ids:
            # For members, total tasks = tasks assigned to them across all projects
            total_tasks = await Task.find(
                {"project_id": {"$in": project_ids}, "assignee_id": user.uid}
            ).count()
            tasks_todo = await Task.find(
                {"project_id": {"$in": project_ids}, "assignee_id": user.uid, "status": TaskStatus.TODO}
            ).count()
            tasks_in_progress = await Task.find(
                {"project_id": {"$in": project_ids}, "assignee_id": user.uid, "status": TaskStatus.IN_PROGRESS}
            ).count()
            tasks_review = await Task.find(
                {"project_id": {"$in": project_ids}, "assignee_id": user.uid, "status": TaskStatus.REVIEW}
            ).count()
            tasks_done = await Task.find(
                {"project_id": {"$in": project_ids}, "assignee_id": user.uid, "status": TaskStatus.DONE}
            ).count()
            overdue_count = await Task.find(
                {"project_id": {"$in": project_ids}, "assignee_id": user.uid, "is_overdue": True}
            ).count()
        else:
            total_tasks = 0
            tasks_todo = tasks_in_progress = tasks_review = tasks_done = 0
            overdue_count = 0

    # Recent audit logs (last 10)
    recent_logs = (
        await AuditLog.find_all()
        .sort("-timestamp")
        .limit(10)
        .to_list()
    )
    logs_data = [
        {
            "uid": str(log.uid),
            "user_id": str(log.user_id),
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": str(log.entity_id),
            "metadata": log.metadata,
            "timestamp": log.timestamp.isoformat(),
        }
        for log in recent_logs
    ]

    return {
        "total_projects": total_projects,
        "total_tasks": total_tasks,
        "tasks_by_status": {
            "todo": tasks_todo,
            "in_progress": tasks_in_progress,
            "review": tasks_review,
            "done": tasks_done,
        },
        "overdue_count": overdue_count,
        "recent_audit_logs": logs_data,
    }


@router.get("/stats", response_model=dict)
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    stats = await _fetch_stats(current_user)

    return {
        "success": True,
        "data": stats,
        "message": "Dashboard stats",
    }
