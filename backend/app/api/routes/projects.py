"""
Project routes — CRUD with RBAC + member management.
"""

from uuid import UUID

from beanie.operators import In, Or
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status

from app.core.deps import get_current_user, require_admin, require_project_member
from app.models.project import Project, ProjectStage, ProjectStatus
from app.models.user import User, UserRole
from app.schemas.project import (
    AddMemberRequest,
    ProjectCreate,
    ProjectDetailOut,
    ProjectListResponse,
    ProjectOut,
    ProjectUpdate,
)
from app.schemas.user import UserOut
from app.services.audit import log_action

router = APIRouter(prefix="/api/projects", tags=["Projects"])


def _project_to_out(p: Project) -> ProjectOut:
    return ProjectOut(
        uid=p.uid,
        name=p.name,
        description=p.description,
        owner_id=p.owner_id,
        member_ids=p.member_ids,
        status=p.status.value,
        stage=p.stage.value,
        stage_updated_by=p.stage_updated_by,
        created_at=p.created_at,
    )


# ── List Projects (admin=all, member=own) ────────────────────────
@router.get("", response_model=dict)
async def list_projects(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    skip = (page - 1) * limit

    if current_user.role == UserRole.ADMIN:
        query = Project.find_all()
    else:
        # Use Beanie criteria to ensure proper UUID handling
        query = Project.find(
            Or(Project.owner_id == current_user.uid, Project.member_ids == current_user.uid)
        )

    total = await query.count()
    projects = await query.skip(skip).limit(limit).to_list()

    return {
        "success": True,
        "data": ProjectListResponse(
            items=[_project_to_out(p) for p in projects],
            total=total,
        ).model_dump(),
        "message": "Projects retrieved",
    }


# ── Create Project (admin only) ─────────────────────────────────
@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreate,
    bg: BackgroundTasks,
    admin: User = Depends(require_admin),
):
    project = Project(
        name=body.name,
        description=body.description,
        owner_id=admin.uid,
    )
    await project.insert()

    bg.add_task(
        log_action, admin.uid, "project.created", "project", project.uid,
        {"name": project.name},
    )

    return {
        "success": True,
        "data": _project_to_out(project).model_dump(),
        "message": "Project created",
    }


# ── Get Project Detail ──────────────────────────────────────────
@router.get("/{project_id}", response_model=dict)
async def get_project(
    project: Project = Depends(require_project_member),
):
    # Resolve member details (including owner)
    all_member_ids = list(set(project.member_ids + [project.owner_id]))
    member_docs = await User.find(In(User.uid, all_member_ids)).to_list()
    members = [
        UserOut(
            uid=m.uid,
            email=m.email,
            full_name=m.full_name,
            role=m.role.value,
            is_active=m.is_active,
            created_at=m.created_at,
        )
        for m in member_docs
    ]

    detail = ProjectDetailOut(
        uid=project.uid,
        name=project.name,
        description=project.description,
        owner_id=project.owner_id,
        member_ids=project.member_ids,
        status=project.status.value,
        stage=project.stage.value,
        stage_updated_by=project.stage_updated_by,
        created_at=project.created_at,
        members=members,
    )

    return {
        "success": True,
        "data": detail.model_dump(),
        "message": "Project detail",
    }


# ── Update Project (admin only) ─────────────────────────────────
@router.put("/{project_id}", response_model=dict)
async def update_project(
    project_id: UUID,
    body: ProjectUpdate,
    bg: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    project = await Project.find_one(Project.uid == project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = body.model_dump(exclude_unset=True)

    # RBAC: Admins can update anything. Members can only update "stage".
    if current_user.role != UserRole.ADMIN:
        # Check if they are a member
        if current_user.uid not in project.member_ids and current_user.uid != project.owner_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Check if they are trying to update fields other than "stage"
        allowed_for_members = {"stage"}
        disallowed = set(update_data.keys()) - allowed_for_members
        if disallowed:
            raise HTTPException(
                status_code=403,
                detail=f"Members can only update the project stage. Attempted: {', '.join(disallowed)}"
            )

    if "status" in update_data:
        update_data["status"] = ProjectStatus(update_data["status"])
    if "stage" in update_data:
        update_data["stage"] = ProjectStage(update_data["stage"])
        project.stage_updated_by = current_user.uid

    for field, value in update_data.items():
        setattr(project, field, value)

    await project.save()

    bg.add_task(
        log_action, current_user.uid, "project.updated", "project", project.uid,
        update_data,
    )

    return {
        "success": True,
        "data": _project_to_out(project).model_dump(),
        "message": "Project updated",
    }


# ── Delete Project (admin only) ─────────────────────────────────
@router.delete("/{project_id}", response_model=dict)
async def delete_project(
    project_id: UUID,
    bg: BackgroundTasks,
    admin: User = Depends(require_admin),
):
    project = await Project.find_one(Project.uid == project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    await project.delete()

    bg.add_task(
        log_action, admin.uid, "project.deleted", "project", project_id,
        {"name": project.name},
    )

    return {
        "success": True,
        "data": None,
        "message": "Project deleted",
    }


# ── Add Member ──────────────────────────────────────────────────
@router.post("/{project_id}/members", response_model=dict)
async def add_member(
    project_id: UUID,
    body: AddMemberRequest,
    bg: BackgroundTasks,
    admin: User = Depends(require_admin),
):
    project = await Project.find_one(Project.uid == project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    user = await User.find_one(User.uid == body.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.user_id not in project.member_ids:
        project.member_ids.append(body.user_id)
        await project.save()
    
    # Reload for the response just to be 100% sure we have fresh data
    project = await Project.find_one(Project.uid == project_id)

    bg.add_task(
        log_action, admin.uid, "project.member_added", "project", project.uid,
        {"added_user_id": str(body.user_id)},
    )

    return {
        "success": True,
        "data": _project_to_out(project).model_dump(),
        "message": "Member added",
    }


# ── Remove Member ───────────────────────────────────────────────
@router.delete("/{project_id}/members/{user_id}", response_model=dict)
async def remove_member(
    project_id: UUID,
    user_id: UUID,
    bg: BackgroundTasks,
    admin: User = Depends(require_admin),
):
    project = await Project.find_one(Project.uid == project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if user_id not in project.member_ids:
        raise HTTPException(status_code=404, detail="User is not a member")

    await project.update({"$pull": {"member_ids": user_id}})

    bg.add_task(
        log_action, admin.uid, "project.member_removed", "project", project.uid,
        {"removed_user_id": str(user_id)},
    )

    return {
        "success": True,
        "data": _project_to_out(project).model_dump(),
        "message": "Member removed",
    }
